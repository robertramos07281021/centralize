import mongoose from "mongoose"
import { DateTime } from "../../middlewares/dateTime.js"
import CustomError from "../../middlewares/errors.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"
import Production from "../../models/production.js"
import User from "../../models/user.js"
import Bucket from "../../models/bucket.js"
import DispoType from "../../models/dispoType.js"
import Department from "../../models/department.js"


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
        
        const agentUser = agent && await User.findOne({user_id: agent}) 
        
        if (!agentUser && agent) throw new CustomError("Agent not found", 404);
        
        const findDispositions = disposition.length > 0 ? await DispoType.find({name: {$in: disposition}}) : [];

        const dispoTypesIds = disposition.length > 0 ? findDispositions.map((dt)=> dt._id) : []
   
        const findBucket = bucket && await Bucket.findOne({name: bucket}) 
        if (!findBucket && bucket) throw new CustomError("Bucket not found", 404);
        
        const customerAccountIds = findBucket
        ? (await CustomerAccount.find({ bucket: findBucket._id })).map(ca => ca._id)
        : [];
     
        const query = [{}]

        if(agent) query.push({user: new mongoose.Types.ObjectId(agentUser._id)})

        if(disposition.length > 0) query.push({disposition: {$in: dispoTypesIds}})
          
        if (from || to) {
          const startDate = from ? new Date(from) : new Date();
          const endDate = to ? new Date(to) : new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          query.push({ createdAt: { $gte: startDate, $lte: endDate } });
        }

        if(bucket) query.push({customer_account: {$in: customerAccountIds}})
        const dispositionReport = await Disposition.aggregate([
          {
            $match: {
              $and: query
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "ca_disposition",
              pipeline: [
                { $project: { name: 1, code: 1 } }
              ]
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
          agent: agentUser && agent ? {
            id: agentUser._id,
            name: agentUser.name,
            branch: agentUser.branch,
            department: agentUser.department,
            user_id: agentUser.user_id,
            buckets: agentUser.buckets
          } : {
            id: "",
            name: "",
            branch: "",
            department: "",
            user_id: "",
            buckets: []
          }
          , 
          bucket: findBucket && bucket ? findBucket.name : "" ,
          disposition: dispositionReport
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAgentDispositions: async()=> {
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();  
        end.setHours(23, 59, 59, 999);

        const agentDispositions = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "agent",
              pipeline: [
                { $project: { name: 1, user_id: 1 } }
              ]
            }
          },
          { $unwind: "$agent" },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "disposition_type",
              pipeline: [
                { $project: { name: 1, code: 1 } }
              ]
            }
          },
          { $unwind: "$disposition_type" },
          {
            $group: {
              _id: {
                agent_id: "$agent._id",
                disposition_id: "$disposition_type._id"
              },
              agent: { $first: "$agent.name" },
              user_id: { $first: "$agent.user_id" },
              dispositionName: { $first: "$disposition_type.name" },
              dispositionCode: { $first: "$disposition_type.code" },
              count: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: "$_id.agent_id",
              agent: { $first: "$agent" },
              user_id: { $first: "$user_id" },
              dispositions: {
                $push: {
                  code: "$dispositionCode",
                  name: "$dispositionName",
                  count: "$count"
                }
              }
            }
          },
          {
            $project: {
              _id:  "$_id",
              agent: 1,
              user_id: 1,
              dispositions: 1
            }
          }
        ])
        return [...agentDispositions]
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getBucketDisposition: async(_, {dept}) => {
      try {
        const bucket = await Bucket.find({dept})
        const newArrayBucket = bucket.map((b)=> b.name)
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();  
        end.setHours(23, 59, 59, 999);
        const bucketDisposition = await Disposition.aggregate([
          {
            $match: {createdAt: { $gte: start, $lte: end }},
          },
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            }
          },
          { $unwind: "$customerAccount" },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "bucket",
            }
          },
          { $unwind: "$bucket" },
          {
            $match: {"bucket.name": {$in: newArrayBucket}},
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "disposition_type",
              pipeline: [
                { $project: { name: 1, code: 1 } }
              ]
            }
          },
          { $unwind: "$disposition_type" },
          {
            $group: {
              _id: {
                bucket_id: "$bucket._id",
                disposition_id: "$disposition_type._id"
              },
              bucket: {$first: "$bucket.name"},
              dispositionName: { $first: "$disposition_type.name" },
              dispositionCode: { $first: "$disposition_type.code" },
              count: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: "$_id.bucket_id",
              bucket: { $first: "$bucket" },
              dispositions: {
                $push: {
                  code: "$dispositionCode",
                  name: "$dispositionName",
                  count: "$count"
                }
              }
            }
          },
          {
            $project: {
              _id: "$_id",
              bucket: 1,
              dispositions: 1
            }
          }
        ])

        return [...bucketDisposition]
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
