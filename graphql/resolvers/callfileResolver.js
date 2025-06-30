import mongoose from "mongoose"
import { DateTime } from "../../middlewares/dateTime.js"
import CustomError from "../../middlewares/errors.js"
import Callfile from "../../models/callfile.js"
import CustomerAccount from "../../models/customerAccount.js"
import {json2csv} from 'json-2-csv'
import Department from "../../models/department.js"

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
                  $group: {
                    _id: "$callfile",
                    accounts: {
                      $sum : 1
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


        ])
        const csv = json2csv(customers)
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