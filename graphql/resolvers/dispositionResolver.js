import mongoose from "mongoose"
import { DateTime } from "../../middlewares/dateTime.js"
import CustomError from "../../middlewares/errors.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"
import Production from "../../models/production.js"


const dispositionResolver = {
  DateTime,
  Query: {
    getAccountDispositions: async(_,{id, limit}) => {
      try {
        const dispositionCount = await Disposition.find({customer_account: new mongoose.Types.ObjectId(id)}).countDocuments()

        const disposition = await Disposition.aggregate([
          {
            $match: {
              customer_account: new mongoose.Types.ObjectId(id)
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "created_by"
            }
          },
          {
            $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } 
          },
          {
            $sort: { createdAt: -1 }
          },
          {
            $limit: limit === 3 ? limit : dispositionCount
          }
          
        ])
        return [...disposition]
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
  Mutation: {
    createDisposition: async(_,{customerAccountId, userId, amount, payment, disposition, payment_date, payment_method, ref_no, comment}) => {
      try {
        const newDisposition = await Disposition.create({
          customer_account: customerAccountId, user:userId, amount:parseFloat(amount) || 0, payment, disposition, payment_date, payment_method, ref_no, comment
        })

        const customerAccount = await CustomerAccount.findById(customerAccountId)
        
        await Disposition.findByIdAndUpdate(customerAccount.current_disposition,
        {
          $set: {
            existing: false
          }
        })
        customerAccount.current_disposition = newDisposition._id
        await customerAccount.save()

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();  
        end.setHours(23, 59, 59, 999);

        const userProd = await Production.findOne({
          $and: [
            {
              user: new mongoose.Types.ObjectId(userId)
            },
            {
              createdAt: { $gte: start, $lte: end }
            }
          ]
        })
        userProd.disposition.push(newDisposition._id)
        await userProd.save()

        return {
          success: true,
          message: "Disposition successfully created"
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
}

export default dispositionResolver
