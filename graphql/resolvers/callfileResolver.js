import { DateTime } from "../../middlewares/dateTime.js"
import CustomError from "../../middlewares/errors.js"
import Callfile from "../../models/callfile.js"
import CustomerAccount from "../../models/customerAccount.js"


const callfileResolver = {
  DateTime,
  Query: {
    getCallfiles: async(_,{bucket,limit,page,status},{user})=> {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const active = status !== "all" ? status === "active" : {$ne: null}
        const resBucket = bucket ? bucket : {$in: user.buckets}
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
        
      const total = result[0].count[0].total || 0
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
        count: total
      }

      } catch (error) {
        throw new CustomError(error.message,500)        
      }
    }
  },
  Result: {
    callfile: async(parent) => {
      try {
        return await Callfile.findById(parent.callfile)
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    }
  },
  Mutation: {
    finishedCallfile: async(_,{callfile}) => {
      try {
        const finishedCallfile = await Callfile.findByIdAndUpdate(callfile,{
          $set: {
            active: false,
            endo: new Date()
          }
        })

        if(!finishedCallfile) throw CustomError("Callfile not found",404) 

        return { 
          success: true,
          message: "Callfile successfully finished"
        }

      } catch (error) {
        throw new CustomError(error.message,500)        
      }
    },
    deleteCallfile: async(_,{callfile}) => {
      try {
        const deleteCallfile = await Callfile.findByIdAndDelete(callfile)
        if(!deleteCallfile) throw CustomError("Callfile not found",404) 
        return {
          success: true,
          message: "Callfile successfully deleted"
        }
      } catch (error) {
        throw new CustomError(error.message,500)   
      }
    } 
  }
}


export default callfileResolver