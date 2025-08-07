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
  }
  

}


export default CustomerExtnResolver