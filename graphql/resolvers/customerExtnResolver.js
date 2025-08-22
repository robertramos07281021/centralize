import mongoose from "mongoose"
import CustomError from "../../middlewares/errors.js"
import CustomerAccount from "../../models/customerAccount.js"




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
        
        const updateCustomerAccount = await CustomerAccount.findByIdAndUpdate(input.id, {$set: forUpdate, $push: {account_update_history: forHistory}},{new: true})

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
        throw new CustomError(error.message, 500)
      }
    }
  }

}


export default CustomerExtnResolver