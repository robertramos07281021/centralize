import mongoose from "mongoose"
import { DateTime } from "../../middlewares/dateTime.js"
import CustomError from "../../middlewares/errors.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"
import Production from "../../models/production.js"
import User from "../../models/user.js"
import Bucket from "../../models/bucket.js"
import DispoType from "../../models/dispoType.js"


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
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "ca_disposition"
            }
          },
          {
            $unwind: { path: "$ca_disposition", preserveNullAndEmptyArrays: true } 
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
    },
    getDispositionReports: async(_,{agent, bucket, disposition, from, to}) => {
      try {
        const agentUser = await User.findOne({user_id: agent})
        if (!agentUser) throw new CustomError("Agent not found", 404);
        
        const findDispositions = await DispoType.find({name: {$in: disposition}});
        const dispoTypesIds = findDispositions.map((dt)=> dt._id);

        const findBucket = await Bucket.findOne({name: bucket})
        if (!findBucket) throw new CustomError("Bucket not found", 404);
        
       
        const customerAccount = await CustomerAccount.find({bucket: findBucket._id});
        const customerAccountIds = customerAccount.map((ca)=> ca._id);

        const start = new Date(from)
        start.setHours(0,0,0,0)

        const end = new Date(to)
        end.setHours(23, 59, 59, 999)

        const dispositionReport = await Disposition.aggregate([
          {
            $match: {
              $and: [
                {user: new mongoose.Types.ObjectId(agentUser._id)},
                {existing: true},
                {createdAt: {$gte: start, $lte: end}},
                {disposition: {$in: dispoTypesIds}},
                {customer_account: {$in: customerAccountIds}}
              ]
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "ca_disposition"
            }
          },
          { $unwind: "$ca_disposition" },
          {
            $group: {
              _id:"$ca_disposition._id",
              name: { $first: "$ca_disposition.name" },
              code: { $first: "$ca_disposition.code" },
              count: {$sum: 1}
            }
          },
          {
            $project: {
              name: 1,
              code: 1,
              count: 1,
              _id: "$_id"
            }
          }
        ])

        return { 
          agent: {
            id: agentUser._id,
            name: agentUser.name,
            branch: agentUser.branch,
            department: agentUser.department,
            user_id: agentUser.user_id,
            buckets: agentUser.buckets
          }, 
          bucket: findBucket.name,
          disposition: dispositionReport
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    } 
  },
  Mutation: {
    createDisposition: async(_,{customerAccountId, userId, amount, payment, disposition, payment_date, payment_method, ref_no, comment}) => {
      try {
        if(disposition === "PAID" && (!amount || !payment || !payment_date || !payment_method || !ref_no)) {
          throw new CustomError("All fields are required",400)
        } 

        const findDispoType = await DispoType.findOne({name: disposition})

        const newDisposition = await Disposition.create({
          customer_account: customerAccountId, user:userId, amount:parseFloat(amount) || 0, payment, disposition: findDispoType._id, payment_date, payment_method, ref_no, comment
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
        userProd.dispositions.push(newDisposition._id)
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
