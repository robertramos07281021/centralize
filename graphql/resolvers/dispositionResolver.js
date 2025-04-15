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
              as: "created_by",
              pipeline: [
                { $project: { agent_id: 1, name: 1 } }
              ]
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
              as: "ca_disposition",
              pipeline: [
                {$project: {name: 1, code: 1, _id: 1}}
              ]
            }
          },
          {
            $unwind: { path: "$ca_disposition", preserveNullAndEmptyArrays: true } 
          },
          {
            $sort: { createdAt: -1 }
          },

          {
            $group:{
              _id: "$_id",
              ca_disposition: {
                $first: "$ca_disposition"
              },
              amount: {$first: "$amount"},
              payment_date:{$first: "$payment_date"},
              ref_no: {$first: "$ref_no"},
              existing: {$first: "$existing"},
              comment: {$first: "$comment"},
              payment: {$first: "$payment"},
              payment_method: {$first : "$payment_method"},
              createdAt: {$first : "$createdAt"},
              created_by: {
                $first: {
                  $cond: [
                    { $ifNull: ["$created_by.agent_id", false] },
                    "$created_by.agent_id",
                    "$created_by.name" 
                  ]
                }
              }
            }
          },

          {
            $project: {
              _id: 1,
              amount: 1,
              ca_disposition: 1,
              payment_date: 1,
              ref_no: 1,
              existing: 1,
              comment: 1,
              payment: 1,
              payment_method: 1,
              createdAt: 1,
              created_by: 1,
            } 
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
    },
    getDispositionPerDay: async(_,{dept}) => {
      try {
        const findDept = await Department.findOne({name: dept})
        if(!findDept) throw new CustomError("Dept not found", 404)

        const year = new Date().getFullYear()
        const month = new Date().getMonth();

        const firstDay = new Date(year,month, 1)
        const lastDay = new Date(year,month + 1,0)

        const dispositionPerDayOfTheMonth = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gte: firstDay, $lte: lastDay }
            }
          },
      
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            }
          },
          {
            $unwind: "$customerAccount"
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "customerBucket"
            }
          },
          {
            $unwind: "$customerBucket"
          },
          {
            $match: {
              "customerBucket.dept": findDept.name
            }
          },
          {
            $group: {
              _id: {
                day: { $dayOfMonth: "$createdAt" }
              },
              amount: { $sum: "$amount" }
            }
          },
          {
            $project: {
              _id: 0,
              day: "$_id.day",
              amount: 1
            }
          },
          {
            $sort: { date: 1 }
          }
        ])     
        return {month: month, dispositionsCount:[...dispositionPerDayOfTheMonth]}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getDispositionPerMonth: async(_,{dept}) => {
      try {
        const findDept = await Department.findOne({name: dept})
        if(!findDept) throw new CustomError("Dept not found", 404)
        const year = new Date().getFullYear()
        const firstMonth = new Date(year, 0, 1)
        const lastMonth = new Date(year, 11, 31, 23, 59, 59, 999)

        const dispositionPerMonth = await Disposition.aggregate([
          {
            $match: {
              createdAt:  { $gte: firstMonth, $lte: lastMonth }
            }
          },
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            }
          },
          {
            $unwind: "$customerAccount"
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "customerBucket"
            }
          },
          {
            $unwind: "$customerBucket"
          },
          {
            $match: {
              "customerBucket.dept": findDept.name
            }
          },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" }
              },
              amount: { $sum: "$amount" }
            }
          },
          {
            $project: {
              _id: 0,
              month: "$_id.month",
              amount: 1
            }
          },
          {
            $sort: { month: 1 }
          }
        ])
        return {year:year, dispositionsCount: [...dispositionPerMonth] }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getDeptDispositionCount: async(_,{dept}) => {
      try {
        const findDept = await Department.findOne({name: dept})
        if(!findDept) throw new CustomError("Dept not found", 404)

        const DepartmentDispositionCount = await Disposition.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            }
          },
          {
            $unwind: "$customerAccount"
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "customerBucket"
            }
          },
          {
            $unwind: "$customerBucket"
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "accountDisposition",
              pipeline: [
                { $project: { code: 1}}
              ]
            }
          },
          {
            $unwind: "$accountDisposition"
          },
          {
            $match: {
              "customerBucket.dept": findDept.name
            }
          },
          {
            $group: {
              _id:"$accountDisposition._id",
              code: {$first: "$accountDisposition.code"},
              count: {$sum: 1}
            }
          },
          {
            $project: {
              _id: "$_id",
              code: 1,
              count: 1
            }
          }
        ])
        return DepartmentDispositionCount
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAllDispositionTypes: async() => {
      try {
        const dispoTypes = await DispoType.find({code: {$ne: "SET"}})
        return dispoTypes
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },

  Mutation: {
    createDisposition: async(_,{customerAccountId, userId, amount, payment, disposition, payment_date, payment_method, ref_no, comment},{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();  
        end.setHours(23, 59, 59, 999);

        const findProd = await Production.findOne({
          $and: [
            {user: user._id},
            {createdAt: {$gte: start, $lte: end}}
          ]
        })

        if(!findProd) {
          await Production.create({
            user: user._id,
          });
        }

        if(disposition === "PAID" && (!amount || !payment || !payment_date || !payment_method || !ref_no)) {
          throw new CustomError("All fields are required",400)
        } 

        const findDispoType = await DispoType.findOne({name: disposition})

        const newDisposition = await Disposition.create({
          customer_account: customerAccountId, user:userId, amount:parseFloat(amount) || 0, payment, disposition: findDispoType._id, payment_date, payment_method, ref_no, comment
        })

        const customerAccount = await CustomerAccount.findById(customerAccountId)
        
        if (amount && (disposition === "PAID" || disposition === "SETTLED"  )) {
          const amountPaid = customerAccount.amount_paid || 0;
          const totalOS = customerAccount.out_standing_details?.total_os || 0;

          const newBalance = disposition === "PAID" ? (totalOS - (amountPaid + amount)).toFixed(2) : 0;

          await CustomerAccount.updateOne(
            { _id: customerAccount._id },
            {
              $inc: { paid_amount: amount },
              $set: { balance: newBalance }
            }
          );
        }

        await Disposition.findByIdAndUpdate(customerAccount.current_disposition,
        {
          $set: {
            existing: false
          }
        })
        customerAccount.current_disposition = newDisposition._id
        await customerAccount.save()

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
        console.log(error)
        throw new CustomError(error.message, 500)
      }
    }
  },
}

export default dispositionResolver
