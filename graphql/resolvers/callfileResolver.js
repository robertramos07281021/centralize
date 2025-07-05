import mongoose from "mongoose"
import { DateTime } from "../../middlewares/dateTime.js"
import CustomError from "../../middlewares/errors.js"
import Callfile from "../../models/callfile.js"
import CustomerAccount from "../../models/customerAccount.js"
import {json2csv } from 'json-2-csv'
import Department from "../../models/department.js"
import ftp from "basic-ftp"

const callfileResolver = {
  DateTime,
  Query: {
    getCallfiles: async(_,{bucket,limit,page,status},{user})=> {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const active = (status !== "all" || !status) ? status === "active" : {$ne: null}
        const resBucket = bucket ? {$eq: new mongoose.Types.ObjectId(bucket)} : {$in: user.buckets.map(e=> new mongoose.Types.ObjectId(e))}
        const skip = (page - 1) * limit;

        const result = await Callfile.aggregate([
          {
            $match: {
              bucket: resBucket,
              active: active
            }
          },
          {
            $facet: {
              count: [
                {
                  $count: "total"
                }
              ],
              data: [
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit }
              ]
            }
          },
        ])

        const total = result[0].count[0]?.total || 0
        const files = result[0].data || []
        const connectedDispo = ['FFUP','PAID','PRC','RPCCB','FV','LM','PTP','UNEG','DEC','ITP','RTP']

        const customerAccounts = (
          await Promise.all(
            files.map((e) =>
              CustomerAccount.aggregate([
                {
                  $match: { 
                    callfile: e._id 
                  } 
                },
                {
                  $lookup: {
                    from: "dispositions",
                    localField: "current_disposition",
                    foreignField: "_id",
                    as: "currentDispo"
                  },
                },
                {
                  $unwind: {path: "$currentDispo",preserveNullAndEmptyArrays: true}
                },
                {
                  $lookup: {
                    from: "dispotypes",
                    localField: "currentDispo.disposition",
                    foreignField: "_id",
                    as: "dispotype"
                  },
                },
                {
                  $unwind: {path: "$dispotype",preserveNullAndEmptyArrays: true}
                },
                {
                  $lookup: {
                    from: "customers",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customerInfo"
                  },
                },
                {
                  $unwind: {path: "$customerInfo",preserveNullAndEmptyArrays: true}
                },
                {
                  $addFields: {
                    hasValidMobile: {
                      $anyElementTrue: {
                        $map: {
                          input: "$customerInfo.contact_no",
                          as: "num",
                          in: {
                            $regexMatch: {
                              input: { $toString: "$$num" },
                              regex: "^09\\d{9}$"
                            }
                          }
                        }
                      }
                    }
                  }
                },
                {
                  $addFields: {
                    hasValidEmail: {
                      $anyElementTrue: {
                        $map: {
                          input: "$customerInfo.emails",
                          as: "email",
                          in: {
                            $regexMatch: {
                              input: { $toString: "$$email" },
                              regex: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
                              options: "i"
                            }
                          }
                        }
                      }
                    }
                  }
                },
                {
                  $group: {
                    _id: "$callfile",
                    accounts: {
                      $sum : 1
                    },
                    uncontactable: {
                      $sum : {
                        $cond: [
                          {
                            $and: [
                              {
                                $eq: ['$hasValidEmail',false] 
                              },
                              {
                                $eq: ['$hasValidMobile',false] 
                              },
                            ]
                          },
                          1,
                          0
                        ]
                      }
                    },
                    connected :{
                      $sum: {
                        $cond: [
                          {
                            $in: [
                              "$dispotype.code",connectedDispo
                            ]
                          },
                          1,
                          0
                        ]
                      }
                    },
                    target: {
                      $sum: "$out_standing_details.total_os"
                    },
                    collected: {
                      $sum: "$paid_amount"
                    }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    callfile: "$_id",
                    uncontactable: 1,
                    accounts: 1,
                    connected: 1,
                    target: 1,
                    collected: 1
                  }
                }
              ])
            )
          )
        ).flat()

        return {
          result: customerAccounts,
          count: total | 0
        }

      } catch (error) {
        throw new CustomError(error.message,500)        
      }
    },
    downloadCallfiles: async(_,{callfile})=> {
      const client = new ftp.Client();
      try {
   
        const customers = await CustomerAccount.aggregate([
          {
            $match: {
              callfile:  new mongoose.Types.ObjectId(callfile)
            }
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "currentDispo"
            },
          },
          {
            $unwind: {path: "$currentDispo",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "users",
              localField: "currentDispo.user",
              foreignField: "_id",
              as: "user"
            },
          },
          {
            $unwind: {path: "$user",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "currentDispo.disposition",
              foreignField: "_id",
              as: "dispotype"
            },
          },
          {
            $unwind: {path: "$dispotype",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "accountBucket"
            },
          },
          {
            $unwind: {path: "$accountBucket",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer_info"
            },
          },
          {
            $unwind: {path: "$customer_info",preserveNullAndEmptyArrays: true}
          },
          {
            $addFields: {
              contact1: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.contact_no" }, 1] },
                  then: { $arrayElemAt: ["$customer_info.contact_no", 0] },
                  else: ""
                }
              },
              contact2: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.contact_no" }, 2] },
                  then: { $arrayElemAt: ["$customer_info.contact_no", 1] },
                  else: ""
                }
              },
              contact3: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.contact_no" }, 3] },
                  then: { $arrayElemAt: ["$customer_info.contact_no", 2] },
                  else: ""
                }
              }
            }
          },
          {
            $addFields: {
              email1: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.emails" }, 1] },
                  then: { $arrayElemAt: ["$customer_info.emails", 0] },
                  else: ""
                }
              },
              email2: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.emails" }, 2] },
                  then: { $arrayElemAt: ["$customer_info.emails", 1] },
                  else: ""
                }
              },
              email3: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.emails" }, 3] },
                  then: { $arrayElemAt: ["$customer_info.emails", 2] },
                  else: ""
                }
              }
            }
          },
          {
            $addFields: {
              address1: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.addresses" }, 1] },
                  then: { $arrayElemAt: ["$customer_info.addresses", 0] },
                  else: ""
                }
              },
              address2: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.addresses" }, 2] },
                  then: { $arrayElemAt: ["$customer_info.addresses", 1] },
                  else: ""
                }
              },
              address3: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.addresses" }, 3] },
                  then: { $arrayElemAt: ["$customer_info.addresses", 2] },
                  else: ""
                }
              }
            }
          },
          {
            $group: {
              _id: "$_id",
              contact1: {$first: "$contact1"},
              contact2: {$first: "$contact2"},
              contact3: {$first: "$contact3"},
              isRPC: {$first: "$customer_info.isRPC"},
              fullname: {$first: "$customer_info.fullName"},
              email1: {$first: "$email1"},
              email2: {$first: "$email2"},
              email3: {$first: "$email3"},
              gender: {$first: "$customer_info.gender"},
              address1: {$first: "$address1"},
              address2: {$first: "$address2"},
              address3: {$first: "$address3"},
              dob: {$first: "$customer_info.dob"},
              collector_sip: {$first: "$user.user_id"},
              collector: {$first: "$user.name"},
              outstanding_balance: {$first: "$out_standing_details.total_os"},
              amount_paid: {$first: "$paid_amount"},
              balance: {$first: "$balance"},
              payment: {$first: "$currentDispo.payment"},
              payment_date: {$first: "$currentDispo.payment_date"},
              payment_method: {$first: "$currentDispo.payment_method"},
              contact_method: {$first: "$currentDispo.contact_method"},
              comment: {$first: "$currentDispo.comment"},
              disposition: {
                $first :{
                  $ifNull: ["$dispotype.name", ""]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              contact1: 1,
              contact2: 1,
              contact3: 1,
              isRPC: 1,
              fullname: 1,
              email1: 1,
              email2: 1,
              email3: 1,
              gender:1,
              address1: 1,
              address2:1,
              address3: 1,
              dob: 1,
              collector_sip: 1,
              collector: 1,
              outstanding_balance:1,
              amount_paid:1,
              balance:1,
              payment: 1,
              payment_date: 1,
              payment_method: 1,
              contact_method: 1,
              comment: 1,
              disposition: 1
            }
          }
        ])

        // const months = [
        //   'January',
        //   'February',
        //   'March',
        //   'April',
        //   'May',
        //   'June',
        //   'July',
        //   'August',
        //   'September',
        //   'October',
        //   'November',
        //   'December'
        // ]

        // await client.access({
        //   host: process.env.FILEZILLA_HOST,
        //   user: process.env.FILEZILLA_USER,
        //   password: process.env.FILEZILLA_PASSWORD,
        //   port: 21,
        //   secure: false,
        // });


        //  for (const e of customers) {
        //   const createdAt = new Date(e.createdAt);
        //   const yearCreated = createdAt.getFullYear();
        //   const monthCreated = months[createdAt.getMonth()];
        //   const dayCreated = createdAt.getDate();
        //   const month = createdAt.getMonth() + 1;
        //   const contact = e.customer.contact_no;
        //   const viciIpAddress = e.bucket.viciIp
        //   const fileNale = {
        //     "172.20.21.64" : "HOMECREDIT",
        //     "172.20.21.10" : "MIXED CAMPAIGN NEW 2",
        //     "172.20.21.17" : "PSBANK",
        //     "172.20.21.27" : "MIXED CAMPAIGN",
        //     "172.20.21.30" : "MCC",
        //     "172.20.21.35" : "MIXED CAMPAIGN",
        //     "172.20.21.67" : "MIXED CAMPAIGN NEW",
        //     '172.20.21.97' : "UB"
        //   }
  

        //   function checkDate(number) {
        //     return number > 9 ? number : `0${number}`;
        //   }
          
        //   const remoteDirVici = `/REC-${viciIpAddress}-${fileNale[viciIpAddress]}/${yearCreated}-${checkDate(month)}-${checkDate(dayCreated)}`
        //   const remoteDirIssabel = `/ISSABEL RECORDINGS/ISSABEL_${e.bucket.issabelIp}/${yearCreated}/${monthCreated + ' ' + yearCreated}/${dayCreated}`;
     
        //   const remoteDir = e.dialer === "vici" ? remoteDirVici : remoteDirIssabel
    
        //   const contactPatterns = contact.map(num =>
        //     num.length < 11 ? num : num.slice(1, 11)
        //   );
        //   let skip = false;
          
        //   try {
        //     const fileList = await client.list(remoteDir);
          
        //     const files = fileList.filter(y =>

        //       contactPatterns.some(pattern => y.name.includes(pattern))
             
             
        //     );
        //     if (files.length > 0) {
        //       filteredWithRecording.push(e._id);
        //     }
        //   } catch (err) {
        //     skip = true;
        //   } 
        //   if (skip) continue;
        // }
        
        console.log(customers[0])


        const csv = json2csv(customers)

  
        return csv
      } catch (error) {
        console.log(error)
        throw new CustomError(error.message,500)    
      } finally {
        client.close()
      }

    },
    monthlyDetails: async(_,__,{user})=> {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const findAomDept = await Department.find({aom: user._id})
        const deptArray = findAomDept.map(e=> e.name)

        const findCallfile = await Callfile.aggregate([
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "callfileBucket"
            },
          },
          {
            $unwind: {path: "$callfileBucket",preserveNullAndEmptyArrays: true}
          },
          {
            $match: {
              "callfileBucket.dept": {$in: deptArray},
              "endo": {$eq: null}
            }
          }
        ])

        const callfile = findCallfile.map(e=> e._id)
        
        const positive = ['KOR','NOA','FV','HUP','LM','ANSM','DEC','RTP','ITP']
        const success = ['PTP','PAID','UNEG','FFUP','RPCCB']
        const unsuccess = ['WN','DISP','OCA','NIS','BUSY']

        const customerAccounts = await CustomerAccount.aggregate([
          {
            $match: {
              callfile: { $in: callfile }
            }
          }, 
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "ca_bucket"
            },
          },
          {
            $unwind: {path: "$ca_bucket",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "ca_current_dispo"
            },
          },
          {
            $unwind: {path: "$ca_current_dispo",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "ca_current_dispo.disposition",
              foreignField: "_id",
              as: "dispotype"
            },
          },
          {
            $unwind: {path: "$dispotype",preserveNullAndEmptyArrays: true}
          },
          {
            $group: {
              _id: {
                callfile: "$callfile",
                department: "$ca_bucket.dept"
              },
              success: {
                $sum: {
                  $cond: [
                    {
                     $in: ["$dispotype.code", success]
                    },
                    1,
                    0
                  ]
                }
              },
              positive: {
                $sum: {
                  $cond: [
                    {
                     $in: ["$dispotype.code", positive]
                    },
                    1,
                    0
                  ]
                }
              },
              unconnected: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        {
                          $in: ["$dispotype.code", unsuccess]
                        },
                        { 
                          $not: ["$current_disposition"] 
                        }
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              department: "$_id.department",
              success: 1,
              positive: 1,
              unconnected: 1
            }
          },{
            $sort: {
              "department" : 1
            }
          }
        ])
        
        return customerAccounts

      } catch (error) {
        throw new CustomError(error.message,500)  
      }
    }
  },
  Result: {
    callfile: async(parent) => {
      try {
        return await Callfile.findById(parent.callfile).populate('finished_by')
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    }
  },
  Mutation: {
    finishedCallfile: async(_,{callfile},{user,pubsub, PUBSUB_EVENTS}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const finishedCallfile = await Callfile.findByIdAndUpdate(callfile,{
          $set: {
            active: false,
            endo: new Date(),
            finished_by: user._id
          }
        },{new: true})

        if(!finishedCallfile) throw CustomError("Callfile not found",404) 

        await pubsub.publish(PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE, {
          updateOnCallfiles: {
            bucket: finishedCallfile.bucket ,
            message: PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE
          },
        });

        return { 
          success: true,
          message: "Callfile successfully finished"
        }

      } catch (error) {
        throw new CustomError(error.message,500)        
      }
    },
    deleteCallfile: async(_,{callfile},{pubsub, PUBSUB_EVENTS}) => {
      try {
        const deleteCallfile = await Callfile.findByIdAndDelete(callfile)

        if(!deleteCallfile) throw CustomError("Callfile not found",404) 
        
        await pubsub.publish(PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE, {
          updateOnCallfiles: {
            bucket: deleteCallfile.bucket ,
            message: PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE
          },
        });

        return {
          success: true,
          message: "Callfile successfully deleted"
        }
      } catch (error) {
        throw new CustomError(error.message,500)   
      }
    } 
  },
}


export default callfileResolver