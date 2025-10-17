import { Query } from "mongoose";
import CustomError from "../../middlewares/errors.js";
import { callViaVicidial } from "../../middlewares/vicidial.js";
import Callfile from "../../models/callfile.js";
import CustomerAccount from "../../models/customerAccount.js";


const callResolver = {
  
  Query: {
    randomCustomer: async(_,__,{user})=> {
      try {
        
        const findCallfile = await Callfile.findOne({ bucket: { $in: user.buckets }, active: true})
  
        const startOfTheDay = new Date()
        startOfTheDay.setHours(0,0,0,0)
        const endOfTheDay = new Date()
        endOfTheDay.setHours(23,59,59,999)
        const success = ['PTP','UNEG','FFUP','KOR','NOA','FV','HUP','LM','ANSM','DEC','RTP','ITP','PAID']


        const randomCustomer = await CustomerAccount.aggregate([
          {
            $match: {
              on_hands: false,
              callfile: findCallfile._id
            }
          },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer_info",
            },
          },
          { 
            $unwind: { path: "$customer_info", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          { 
            $unwind: { path: "$customer_info", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          { 
            $unwind: { path: "$account_bucket", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "current_disposition",
            },
          },
          { 
            $unwind: { path: "$current_disposition", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "history",
              foreignField: "_id",
              as: "dispo_history",
            },
          },
          {
            $addFields: {
              isRPCToday: {
                $cond: {
                  if: {
                    $and: [
                      { $in: ["$dispotype.code", success] },
                      { $gte: ["$createdAt", startOfTheDay] },
                      { $lte: ["$createdAt", endOfTheDay] }
                    ]
                  },
                  then: true,
                  else: false
                }
              }
            }
          },
          { $sample: { size: 1} }
        ])
  
        return randomCustomer[0]
      } catch (error) {
        throw new CustomError('Failed to initiate call',500);
      }
    }
  },

  Mutation: {
    makeCall: async(_, { phoneNumber }, {user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const res = await callViaVicidial(user.vici_id, phoneNumber)
        return `Call initiated successfully: ${JSON.stringify(res)}`;
      } catch (err) {
        throw new CustomError('Failed to initiate call',500);
      }
    },
  }
}

export default callResolver




