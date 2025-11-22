import mongoose from "mongoose"
import CustomError from "../../middlewares/errors.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"
import Bucket from "../../models/bucket.js"
import Callfile from "../../models/callfile.js"

const CustomerExtnResolver = {
  Query: {
    findAccountHistories: async(_,{id})=> {
      try {
        const findCustomerAccount = await CustomerAccount.findById(id)
        if(!findCustomerAccount) throw new CustomError('Customer not found',400)
        
        const findHistory = await CustomerAccount.aggregate([
          {
            $match: {
              case_id: {$eq: findCustomerAccount.case_id },
              callfile: {$ne: new mongoose.Types.ObjectId(findCustomerAccount.callfile)},
              current_disposition: {$exists: true},
            }
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "cd"
            },
          },
          {
            $unwind: {path: "$cd",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket"
            },
          },
          {
            $unwind: {path: "$account_bucket",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "cd.disposition",
              foreignField: "_id",
              as: "dispotype"
            },
          },
          {
            $unwind: {path: "$dispotype",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "callfiles",
              localField: "callfile",
              foreignField: "_id",
              as: "account_callfile"
            },
          },
          {
            $unwind: {path: "$account_callfile",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "users",
              localField: "cd.user",
              foreignField: "_id",
              as: "user"
            },
          },
          {
            $unwind: {path: "$user",preserveNullAndEmptyArrays: true}
          },
          {
            $sort: {
              createdAt: 1
            }
          }
        ])

        return findHistory
      } catch (error) {
            console.log(error)
        throw new CustomError(error.message, 500)
      }
    },
    noPTPCollection: async(_,{bucket, interval})=> {
      try {
        const selectedBucket = await Bucket.findById(bucket)
        const callfile =(await Callfile.find({bucket: selectedBucket?._id }))?.map(x=> new mongoose.Types.ObjectId(x._id))
        if(callfile.length < 1) return null

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

    
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endOfMonth.setMilliseconds(-1);

        let selectedInterval = {}
        if(interval === "daily") {
          selectedInterval['$gt'] = todayStart
          selectedInterval['$lte'] = todayEnd
          
        } else if (interval === "weekly") {
          selectedInterval['$gt'] = startOfWeek
          selectedInterval['$lte'] = endOfWeek
          
        } else if (interval === "monthly") {
          selectedInterval['$gt'] = startOfMonth
          selectedInterval['$lte'] = endOfMonth
        }

        const paid = await Disposition.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount"
            },
          },
          {
            $unwind: {path: "$customerAccount",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "bucket",
            }
          },
          {
            $unwind: {path: "$bucket",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            }
          },
          {
            $unwind: {path: "$dispotype",preserveNullAndEmptyArrays: true}
          },
          {
            $match: {
              createdAt:selectedInterval,
              "dispotype.code" : "PAID",
              ptp: false,
              selectivesDispo: true,
              callfile: {$in: callfile}
            }
          },
          {
            $group: {
              _id: "$customerAccount.case_id",
              count: { $sum: 1 },
              amount: { $sum: "$amount" }
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },       
              amount: { $sum: "$amount" }
            }
          },
          {
            $project: {
              _id: 0,
              count: 1,
              amount: 1
            }
          }

        ])

        return paid[0]
      } catch (error) {
            console.log(error)
        throw new CustomError(error.message, 500)
      }
    }
  },
  Mutation: {
    updateCustomerAccount: async(_,{input},{user})=> {
      try {
      if(!user) throw new CustomError("Unauthorized",401)
        const forUpdate = {}
        if(input.total_os && input.total_os > 0) {forUpdate['out_standing_details.total_os'] = Number(input.total_os)}
        if(input.principal_os && input.principal_os > 0) {forUpdate['out_standing_details.principal_os'] = Number(input.principal_os)}
        if(input.balance && input.balance > 0 ) {forUpdate['balance'] = Number(input.balance)}
      
        const forHistory = {
          updated_date:new Date(),
          updated_by: user._id
        }

        if(input.total_os && input.total_os > 0) {
           forHistory['total_os'] = Number(input.total_os)
        }

        if(input.principal_os && input.principal_os > 0) {
          forHistory['principal_os'] = Number(input.principal_os)
        }

        if(input.balance && input.balance > 0 ){
           forHistory['balance'] = Number(input.balance)
        } 

        const findCustomerAccountExistingCallfile = await CustomerAccount.findById(input.id)

        const existingOnCallfile = {
          principal_os: findCustomerAccountExistingCallfile.out_standing_details.principal_os,
          total_os: findCustomerAccountExistingCallfile.out_standing_details.principal_os,
          balance: findCustomerAccountExistingCallfile.balance,
        }

        const updateCustomerAccount = await CustomerAccount.findByIdAndUpdate(input.id, {$set: forUpdate, $push: {account_update_history: forHistory}, from_existing: existingOnCallfile},{new: true})

        if(!updateCustomerAccount) throw new CustomError('Account not found',404)

        return {
          success: true,
          message: "Successfully Updated Customer Account",
          customerAccount: {
            balance: updateCustomerAccount.balance,
            out_standing_details: updateCustomerAccount.out_standing_details,
            account_update_history: updateCustomerAccount.account_update_history
          }
        }
      } catch (error) {
            console.log(error)
        throw new CustomError(error.message, 500)
      }
    }
  }

}


export default CustomerExtnResolver