import mongoose from "mongoose"
import { DateTime } from "../../middlewares/dateTime.js"
import CustomError from "../../middlewares/errors.js"
import Callfile from "../../models/callfile.js"
import CustomerAccount from "../../models/customerAccount.js"
import {json2csv } from 'json-2-csv'
import Department from "../../models/department.js"

const uniqueCodes = [
  2, 32, 33, 34, 35, 36, 38, 42, 43, 44, 45, 46, 47, 48, 49, 52, 53, 54, 55, 56,
  62, 63, 64, 65, 68, 72, 74, 75, 77, 78, 82, 83, 84, 85, 86, 87, 88, 8822, 8842
];


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
                    callfile: new mongoose.Types.ObjectId(e._id) 
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

    getBucketCallfile: async(_,{bucketId},{user})=> {
      try {
        if(!user) throw new CustomError("Unauthorized",401)

        const filter = bucketId.length > 0 ? { bucket: { $in: bucketId.map(x=>new mongoose.Types.ObjectId(x))}} : { bucket: {$in: user.buckets.map(x=> new mongoose.Types.ObjectId(x))}}
        console.log(filter)
        const findActiveCallfile = await Callfile.aggregate([
          {
            $match: filter
          },
          {
            $sort: {active: -1}
          }
        ])
        return findActiveCallfile
      } catch (error) {
        console.log(error)
        throw new CustomError(error.message,500)       
      }
    },

    downloadCallfiles: async(_,{callfile})=> {
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
            $addFields: {
              hasValidMobile: {
                $anyElementTrue: {
                  $map: {
                    input: "$customer_info.contact_no",
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
                    input: "$customer_info.emails",
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
            $addFields: {
              hasCurrentDispo: {
               $cond: {
                  if: { $ne: ["$currentDispo", null] },
                  then: true,
                  else: false
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              contact1: "$contact1",
              contact2: "$contact2",
              contact3: "$contact3",
              isRPC:  "$customer_info.isRPC",
              fullname:"$customer_info.fullName",
              email1:   {
                  $ifNull: ["$email", ""]
                },
              account_bucket: "$accountBucket",
              email2:  "$email2",
              email3:  "$email3",
              gender:  "$customer_info.gender",
              address1:  "$address1",
              address2:  "$address2",
              address3:  "$address3",
              dob: "$customer_info.dob",
              customer: "$customer_info",
              collector_sip:  "$user.user_id",
              collector:  "$user.name",
              outstanding_balance:  "$out_standing_details.total_os",
              endorsement_date: "$endorsement_date",
              amount_paid:  "$paid_amount",
              amount: "$currentDispo.amount",
              balance:  "$balance",
              dialer: "$currentDispo.dialer",
              platform_user_id: "$platform_customer_id",
              emergencyContactName: "$emergency_contact.name",
              emergencyContactMobile: "$emergency_contact.mobile",
              payment:  {
                $cond: {
                  if: {
                    $eq: ['$hasCurrentDispo',true]
                  },
                  then: "$currentDispo.payment",
                  else : ""
                }
              },
              payment_date:  {
                $cond: {
                  if: {
                    $eq: ['$hasCurrentDispo',true]
                  },
                  then: "$currentDispo.payment_date",
                  else : ""
                }
              },
              payment_method:  {
                $cond: {
                  if: {
                    $eq: ['$hasCurrentDispo',true]
                  },
                  then: "$currentDispo.payment_method",
                  else : ""
                }
              },
              contact_method: {
                $cond: {
                  if: {
                    $eq: ['$hasCurrentDispo',true]
                  },
                  then: "$currentDispo.contact_method",
                  else : ""
                }
              },
              comment:{
                $cond: {
                  if: {
                    $eq: ['$hasCurrentDispo',true]
                  },
                  then: "$currentDispo.comment",
                  else : ""
                }
              },
              currentDispo: {
                $cond: {
                  if: {
                    $eq: ['$hasCurrentDispo',true]
                  },
                  then: "$currentDispo",
                  else : ""
                }
              },
              disposition: {
                $cond: {
                  if: {
                    $eq: ['$hasCurrentDispo',true]
                  },
                  then: "$dispotype.name",
                  else : ""
                }
              },
              contactable: {
                $cond: {
                  if: {
                    $or: [
                      {
                        $eq: ['$hasValidEmail',true]
                      },
                      {
                        $eq: ['$hasValidMobile',true]
                      }
                    ]
                  },
                  then: true,
                  else : false
                }
              }
            }
          },
        ])

        const csv = json2csv(customers, {
          keys: [
            'contact1',
            'contact2',
            'contact3',
            'isRPC',
            'platform_user_id',
            "fullname",
            'email1',
            'email2',
            'email3',
            'gender',
            'address1',
            'address2',
            'address3',
            "dob",
            "emergencyContactName",
            'emergencyContactMobile',
            'collector_sip',
            'collector',
            'outstanding_balance',
            'amount_paid',
            'amount',
            'balance',
            'payment',
            'payment_date',
            'payment_method',
            'contact_method',
            'comment',
            'disposition',
            'endorsement_date',
            'contactable',
            'dialer'
          ],
          emptyFieldValue: ""
        })
  
  
        return csv
      } catch (error) {
        throw new CustomError(error.message,500)    
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
              active: {$eq: true},
            }
          }
        ])

        const callfile = findCallfile.map(e=> new mongoose.Types.ObjectId(e._id))
        
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
              rpc: {
                $sum: {
                  $cond: [
                    {
                     $eq: ["$customer_info.isRPC", true]
                    },
                    1,
                    0
                  ]
                }
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
              rpc: 1,
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

        const checkIfFinished = await Callfile.findById(callfile)
        if(checkIfFinished.endo) throw new CustomError("Already Finished", 400)

        const finishedCallfile = await Callfile.findByIdAndUpdate(callfile,{
          $set: {
            active: false,
            endo: new Date(),
            finished_by: user._id
          }
        },{new: true})

        await CustomerAccount.updateMany(
          { callfile: new mongoose.Types.ObjectId(finishedCallfile._id) }, 
          { 
            $unset: { assigned: "", assigned_date: ""}, 
            $set: { on_hands: false }
          }
        )

        if(!finishedCallfile) throw new CustomError("Callfile not found",404) 

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