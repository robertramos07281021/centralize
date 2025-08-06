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