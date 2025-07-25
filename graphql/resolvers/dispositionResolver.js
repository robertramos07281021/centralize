import mongoose, { Types } from "mongoose"
import { DateTime } from "../../middlewares/dateTime.js"
import CustomError from "../../middlewares/errors.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"
import Production from "../../models/production.js"
import User from "../../models/user.js"
import Bucket from "../../models/bucket.js"
import DispoType from "../../models/dispoType.js"
import Group from "../../models/group.js"
import Department from "../../models/department.js"


const dispositionResolver = {
  DateTime,
  Query: {

    getAccountDispoCount: async(_,{id})=> {
      try {
        const dispositionCount = await Disposition.countDocuments({customer_account: new mongoose.Types.ObjectId(id)})
        return {count:dispositionCount}
      } catch (error) {
       throw new CustomError(error.message, 500)
      }
    },
    getAccountDispositions: async(_,{id, limit}) => {
      try {
        const dispositionCount = await Disposition.countDocuments({customer_account: new mongoose.Types.ObjectId(id)})
     
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
              contact_method: {$first: "$contact_method"},
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
              contact_method: 1
            } 
          },
          {
            $sort: { createdAt: -1 }
          },
          {
            $limit: limit === 3 ? limit : dispositionCount
          },
        ])
        return disposition
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getDispositionReports: async(_,{reports},{user}) => {
      try {
        const {agent, bucket, disposition, from, to, callfile} = reports
        const bucketFilter = mongoose.Types.ObjectId.isValid(bucket) ? {_id: bucket} : {name: bucket}
        const [
          agentUser,
          findDispositions, 
          findBucket] = await Promise.all([
          await User.findOne({user_id: agent}).lean(),
          await DispoType.find({name: {$in: disposition}}).lean(),
          await Bucket.findOne(bucketFilter).lean()
        ])
        if (!agentUser && agent) throw new CustomError("Agent not found", 404);


        const dispoTypesIds = disposition.length > 0 ? findDispositions.map((dt)=> new mongoose.Types.ObjectId(dt._id)) : []
        
        if (!findBucket && bucket) throw new CustomError("Bucket not found", 404);
     
        
        const customerAccountIds = findBucket
        ? (await CustomerAccount.find({ bucket: findBucket._id }).lean()).map(ca => ca._id)
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
          let objectId = null

        if (Types.ObjectId.isValid(callfile)) {
          objectId = new Types.ObjectId(callfile);
        } 

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
          {
            $unwind: {path: "$ca_disposition",preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "ca",
            
            }
          },
          {
            $unwind: {path: "$ca",preserveNullAndEmptyArrays: true}
          },
          {
            $addFields: {
              bucket: "$ca.bucket",
              callfile: "$ca.callfile"
            }
          },
          {
            $match: {
              bucket: {$in: user.buckets},
              callfile: objectId ? new mongoose.Types.ObjectId(objectId) : null,
              existing: {$eq: true}
            }
          },  
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
          agent: agent ? agentUser : null, 
          bucket: bucket ? findBucket.name : "" ,
          disposition: dispositionReport
        }
      } catch (error) {
        console.log(error)
        throw new CustomError(error.message, 500)
      }
    },
    
    getAllDispositionTypes: async() => {
      try {
        return await DispoType.find({code: {$ne: "SET"}}).lean()
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },

    getDailyFTE: async(_,__,{user}) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const aomCampaign = await Department.find({aom: user._id}).lean()
        const aomCampaignNameArray = aomCampaign.map(e => e.name)
        const campaignBucket = (await Bucket.find({dept: {$in: aomCampaignNameArray}}).lean()).map(e=> e._id)

        const dailyFTE = await Disposition.aggregate([
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
            $match: {
              createdAt: {$gte:todayStart, $lt: todayEnd },
              "bucket._id": {$in: campaignBucket}
            }
          },
          {
            $group: {
              _id: {
                campaign: "$bucket.dept",
                user: "$user"
              },
            }
          },
          {
            $group: {
              _id: "$_id.campaign",
              online: {$sum: 1}
            }
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              online: 1
            }
          }
        ])


        const newDailyFTE = dailyFTE.map(e => {
          const newCampaignArray = aomCampaign.find(c=> e.campaign === c.name)
          return {
            ...e,
            campaign: newCampaignArray ? newCampaignArray._id : null,
          }
        })
        return newDailyFTE

      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAOMPTPPerDay: async(_,__,{user} ) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const aomCampaign = await Department.find({aom: user._id}).lean()
        const aomCampaignNameArray = aomCampaign.map(e => e.name)
        const campaignBucket = await Bucket.find({dept: {$in: aomCampaignNameArray}}).lean()
        const newArrayCampaignBucket = campaignBucket.map(e=> e._id)

        const PTPOfMonth = await Disposition.aggregate([
          {
            $match: {
              createdAt: {$gte:todayStart, $lt:todayEnd},
            }
          },
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
            $match: {
              "bucket._id" : {$in: newArrayCampaignBucket}
            }
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
              "dispotype.code" : "PTP",
            }
          },
          {
            $group: {
              _id: "$bucket.dept",
              calls: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','calls']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              sms: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','sms']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              email: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','email']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              skip: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','skip']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              field: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','field']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              total: {$sum: "$amount"}
            }
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              skip: 1,
              calls: 1,
              sms: 1,
              email: 1,
              field: 1,
              total: 1
            }
          }


        ])

        const newPTPOfMonth = PTPOfMonth.map(pom=> {
          const campaign = aomCampaign.find(ac => pom.campaign === ac.name)
          return {
            ...pom,
            campaign: campaign ? campaign._id : null
          }
        })

        return newPTPOfMonth
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAOMPTPKeptPerDay: async(_,__,{user} ) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const aomCampaign = await Department.find({aom: user._id}).lean()
        const aomCampaignNameArray = aomCampaign.map(e => e.name)
        const campaignBucket = await Bucket.find({dept: {$in: aomCampaignNameArray}}).lean()
        const newArrayCampaignBucket = campaignBucket.map(e=> e._id)

        const PTPKeptOfMonth = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gte: todayStart, $lt: todayEnd },
              ptp: true
            }
          },

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
            $match: {
              "bucket._id" : {$in: newArrayCampaignBucket}
            }
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
              "dispotype.code" : "PAID",
            }
          },
          {
            $group: {
              _id: "$bucket.dept",
              calls: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','calls']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              sms: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','sms']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              email: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','email']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              skip: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','skip']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              field: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','field']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              total: {$sum: "$amount"}
            }
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              skip: 1,
              calls: 1,
              sms: 1,
              email: 1,
              field: 1,
              total: 1
            }
          }

        ])

        const newPTPKeptOfMonth = PTPKeptOfMonth.map(pom=> {
          const campaign = aomCampaign.find(ac => pom.campaign === ac.name)
          return {
            ...pom,
            campaign: campaign ? campaign._id : null
          }
        })

        return newPTPKeptOfMonth
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAOMPaidPerDay: async(_,__,{user} ) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const aomCampaign = await Department.find({aom: user._id}).lean()
        const aomCampaignNameArray = aomCampaign.map(e => e.name)
        const campaignBucket = await Bucket.find({dept: {$in: aomCampaignNameArray}}).lean()
        const newArrayCampaignBucket = campaignBucket.map(e=> e._id)

        const PTPKeptOfMonth = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gte: todayStart, $lt: todayEnd },
              ptp: false
            }
          },

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
            $match: {
              "bucket._id" : {$in: newArrayCampaignBucket}
            }
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
              "dispotype.code" : "PAID",
            }
          },
          {
            $group: {
              _id: "$bucket.dept",
              calls: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','calls']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              sms: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','sms']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              email: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','email']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              skip: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','skip']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              field: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$contact_method','field']
                    },
                    "$amount",
                    0
                  ]
                }                
              },
              total: {$sum: "$amount"}
            }
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              skip: 1,
              calls: 1,
              sms: 1,
              email: 1,
              field: 1,
              total: 1
            }
          }
        ])

        const newPTPKeptOfMonth = PTPKeptOfMonth.map(pom=> {
          const campaign = aomCampaign.find(ac => pom.campaign === ac.name)
          return {
            ...pom,
            campaign: campaign ? campaign._id : null
          }
        })

        return newPTPKeptOfMonth
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getTLPaidToday: async(_,__,{user})=> {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const campaignBucket = (await Bucket.find({_id: {$in: user.buckets}}).lean()).map(e=> e._id)

        const tlPaidToday = await Disposition.aggregate([
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
              createdAt: {$gte:todayStart, $lt:todayEnd},
              "dispotype.code" : "PAID",
              ptp : false,
              "bucket._id" : {$in: campaignBucket}
            }
          },
          {
            $group: {
              _id:"$bucket._id",
              calls: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','calls']},"$amount",0]
                }
              },
              sms: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','sms']},"$amount",0]
                }
              },
              email: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','email']},"$amount",0]
                }
              },
              skip: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','skip']},"$amount",0]
                }
              },
              field: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','field']},"$amount",0]
                }
              },
            }
          },
          {
            $project: {
              _id: 0,
              bucket: "$_id",
              calls: 1,
              sms: 1,
              email: 1,
              skip: 1,
              field: 1
            }
          }
        ])

        return tlPaidToday
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getTLPTPKeptToday: async(_,__,{user}) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const campaignBucket = (await Bucket.find({_id: {$in: user.buckets}}).lean()).map(e=> e._id)

        const tlPtpKeptToday = await Disposition.aggregate([
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
              createdAt: {$gte:todayStart, $lt:todayEnd},
              "dispotype.code" : "PAID",
              ptp : true,
              "bucket._id" : {$in: campaignBucket}
            }
          },
          {
            $group: {
              _id:"$bucket._id",
              calls: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','calls']},"$amount",0]
                }
              },
              sms: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','sms']},"$amount",0]
                }
              },
              email: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','email']},"$amount",0]
                }
              },
              skip: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','skip']},"$amount",0]
                }
              },
              field: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','field']},"$amount",0]
                }
              },
            }
          },
          {
            $project: {
              _id: 0,
              bucket: "$_id",
              calls: 1,
              sms: 1,
              email: 1,
              skip: 1,
              field: 1
            }
          }
        ])

        return tlPtpKeptToday
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getTLPTPToday: async(_,__,{user})=> {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const campaignBucket = (await Bucket.find({_id: {$in: user.buckets}}).lean()).map(e=> e._id)

        const tlPtpToday = await Disposition.aggregate([
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
              createdAt: {$gte:todayStart, $lt:todayEnd},
              "dispotype.code" : "PTP",
              ptp : true,
              "bucket._id" : {$in: campaignBucket}
            }
          },
          {
            $group: {
              _id:"$bucket._id",
              calls: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','calls']},"$amount",0]
                }
              },
              sms: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','sms']},"$amount",0]
                }
              },
              email: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','email']},"$amount",0]
                }
              },
              skip: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','skip']},"$amount",0]
                }
              },
              field: {
                $sum: {
                  $cond: [{$eq: ['$contact_method','field']},"$amount",0]
                }
              },
            }
          },
          {
            $project: {
              _id: 0,
              bucket: "$_id",
              calls: 1,
              sms: 1,
              email: 1,
              skip: 1,
              field: 1
            }
          }
        ])

        return tlPtpToday
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getTLPTPTotals: async(_,__,{user})=> {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterDayEnd = new Date();
        yesterDayEnd.setDate(yesterDayEnd.getDate() - 1 )
        yesterDayEnd.setHours(23, 59, 59, 999);

        const campaignBucket = await Bucket.find({_id: {$in: user.buckets}}).lean()
        const newBucket = campaignBucket.map(e=> e._id)

        const PTP = await Disposition.aggregate([
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
              createdAt: {$gte:yesterdayStart, $lt:todayEnd},
              "dispotype.code" : "PTP",
              ptp : true,
              "bucket._id" : {$in: newBucket}
            }
          },
          {
            $group: {
              _id: "$bucket._id",
              count: {
                $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",todayStart]},{$lt: ['$createdAt',todayEnd]}]
                  },1,0]
                }
              },
              amount: {
                $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",todayStart]},{$lt: ['$createdAt',todayEnd]}]
                  },"$amount",0]
                }
              },
              yesterday: {
                 $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",yesterdayStart]},{$lt: ['$createdAt',yesterDayEnd]}]
                  },"$amount",0]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              bucket: "$_id",
              count: 1,
              amount: 1,
              yesterday: 1
            }
          },
          {
            $sort: {
              bucket: 1
            }
          }
        ])
        
        return PTP
      } catch (error) {

        throw new CustomError(error.message, 500)
      }
    },
    getTLPTPKeptTotals: async(_,__,{user}) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterDayEnd = new Date();
        yesterDayEnd.setDate(yesterDayEnd.getDate() - 1 )
        yesterDayEnd.setHours(23, 59, 59, 999);

        const campaignBucket = await Bucket.find({_id: {$in: user.buckets}}).lean()
        const newBucket = campaignBucket.map(e=> e._id)


        const PTPKept = await Disposition.aggregate([
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
              createdAt: {$gte:yesterdayStart, $lt:todayEnd},
              "dispotype.code" : "PAID",
              ptp : true,
              "bucket._id" : {$in: newBucket}
            }
          },
          {
            $group: {
              _id: "$bucket._id",
              count: {
                $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",todayStart]},{$lt: ['$createdAt',todayEnd]}]
                  },1,0]
                }
              },
              amount: {
                $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",todayStart]},{$lt: ['$createdAt',todayEnd]}]
                  },"$amount",0]
                }
              },
              yesterday: {
                 $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",yesterdayStart]},{$lt: ['$createdAt',yesterDayEnd]}]
                  },"$amount",0]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              bucket: "$_id",
              count: 1,
              amount: 1,
              yesterday: 1
            }
          },
          {
            $sort: {
              bucket: 1
            }
          }
        ])
        
        return PTPKept
      } catch (error) {
        throw new CustomError(error.message, 500)        
      }
    },
    getTLPaidTotals: async(_,__,{user})=> {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterDayEnd = new Date();
        yesterDayEnd.setDate(yesterDayEnd.getDate() - 1 )
        yesterDayEnd.setHours(23, 59, 59, 999);

        const campaignBucket = await Bucket.find({_id: {$in: user.buckets}}).lean()
        const newBucket = campaignBucket.map(e=> e._id)

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
              createdAt: {$gte:yesterdayStart, $lt:todayEnd},
              "dispotype.code" : "PAID",
              ptp : false,
              "bucket._id" : {$in: newBucket}
            }
          },
          {
            $group: {
              _id: "$bucket._id",
              count: {
                $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",todayStart]},{$lt: ['$createdAt',todayEnd]}]
                  },1,0]
                }
              },
              amount: {
                $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",todayStart]},{$lt: ['$createdAt',todayEnd]}]
                  },"$amount",0]
                }
              },
              yesterday: {
                 $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",yesterdayStart]},{$lt: ['$createdAt',yesterDayEnd]}]
                  },"$amount",0]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              bucket: "$_id",
              count: 1,
              amount: 1,
              yesterday: 1
            }
          },
          {
            $sort: {
              bucket: 1
            }
          }
        ])


        return paid
      } catch (error) {
        throw new CustomError(error.message, 500)        
      }
    },
    getTLDailyCollected: async(_,__,{user}) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterDayEnd = new Date();
        yesterDayEnd.setDate(yesterDayEnd.getDate() - 1 )
        yesterDayEnd.setHours(23, 59, 59, 999);

        const campaignBucket = await Bucket.find({_id: {$in: user.buckets}}).lean()
        const newBucket = campaignBucket.map(e=> e._id)

        const dailyCollected = await Disposition.aggregate([
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
              createdAt: {$gte:yesterdayStart, $lt:todayEnd},
              "bucket._id" : {$in: newBucket}
            }
          },
          {
            $group: {
              _id: "$bucket.dept",
              amount: {
                $sum: {
                  $cond: [
                    {
                     $and: [
                        {
                          $gte: ["$createdAt",todayStart]
                        },
                        {
                          $lt: ['$createdAt',todayEnd]
                        },
                        {
                          $eq: ['$dispotype.code',"PAID"]
                        }
                      ]
                    },
                    "$amount",
                    0
                  ]
                }
              },
              yesterday: {
                 $sum: {
                  $cond: [{
                    $and: [{$gte: ["$createdAt",yesterdayStart]},{$lt: ['$createdAt',yesterDayEnd]},{$eq: ['$dispotype.code',"PAID"]}]
                  },"$amount",0]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              bucket: "$_id",
              amount: 1,
              count: 1,
              yesterday: 1
            }
          },
          {
            $sort: {
              bucket: 1
            }
          }
        ])

        return dailyCollected
      } catch (error) {
        throw new CustomError(error.message, 500) 
      }
    },
    agentDispoDaily: async(_,__,{user})=> {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterDayEnd = new Date();
        yesterDayEnd.setDate(yesterDayEnd.getDate() - 1 )
        yesterDayEnd.setHours(23, 59, 59, 999);
        const campaignBucket = await Bucket.find({_id: {$in: user.buckets}}).lean()
        const newBucket = campaignBucket.map(e=> e._id)

        function setGroupForDailyCollection (name,ptp,start,end) {
          const andArray = [
            {
              $gte: ['$createdAt',start]
            },
            {
              $lt: ['$createdAt',end]
            },
          ]

          if(name === 'PTP') {
            andArray.push({ $eq: ['$dispotype.code','PTP'] }) 
          }

          if(name === 'PAID' && ptp === true) {
            andArray.push({$eq: ['$dispotype.code','PAID']}) 
            andArray.push({$eq: ['$ptp', ptp]} )
          }
          
          if(name === 'PAID' && ptp === false) {
            andArray.push({ $eq: ['$dispotype.code','PAID']}) 
            andArray.push({$eq: ['$ptp', ptp]} )
          }

          return {
            $sum: {
              $cond: [
                {
                  $and: andArray
                },
                "$amount",
                0
              ]
            } 
          }
        }

        const agentDispoDaily = await Disposition.aggregate([
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
              from: "customers",
              localField: "customerAccount.customer",
              foreignField: "_id",
              as: "customer"
            },
          },
          {
            $unwind: {path: "$customer",preserveNullAndEmptyArrays: true}
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
              createdAt: {$gte:yesterdayStart, $lt:todayEnd},
              "bucket._id" : {$in: newBucket}
            }
          },
          {
            $group: {
              _id: "$user",
              ptp: setGroupForDailyCollection('PTP',true,todayStart,todayEnd),
              pk: setGroupForDailyCollection('PAID',true,todayStart,todayEnd),
              ac: setGroupForDailyCollection('PAID',false,todayStart,todayEnd),
              y_ptp: setGroupForDailyCollection('PTP',true, yesterdayStart, yesterDayEnd),
              y_pk: setGroupForDailyCollection('PAID',true, yesterdayStart, yesterDayEnd),
              y_ac: setGroupForDailyCollection('PAID',false, yesterdayStart, yesterDayEnd),
              rpc: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ['$customer.isRPC', true]
                        },
                        {
                          $gte: ["$createdAt",todayStart]
                        },
                        {
                          $lt: ["$createdAt",todayEnd]
                        }
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              count: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $gte: ["$createdAt",todayStart]
                        },
                        {
                          $lt: ['$createdAt',todayEnd]
                        },
                      ]
                    },
                    1,
                    0
                  ]
                }
              },

            }
          },
          {
            $project: {
              _id: 0,
              user: "$_id",
              pk: 1,
              ptp: 1,
              rpc: 1,
              ac: 1,
              y_ac: 1,
              y_ptp: 1,
              y_pk: 1,
              count: 1,
            }
          },
          {
            $sort: {
              user: 1
            }
          }
        ])

        return agentDispoDaily
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getTargetPerCampaign: async(_,__,{user}) => {
      try {
        const buckets = (await Bucket.find({_id: {$in: user.buckets}}).lean()).map(e=> e._id)
 
        const customerAccount = await CustomerAccount.aggregate([
          {
            $match: {
              bucket: {$in: buckets}
            }
          },
          {
            $group: {
              _id: "$bucket",
              collected: {
                $sum: "$paid_amount"
              },
              target: {
                $sum:  "$out_standing_details.total_os"
              }
            }
          },
          {
            $project: {
              _id: 0,
              bucket: "$_id",
              collected: 1,
              target: 1
            }
          }
        ])

        return customerAccount
      } catch (error) {
        throw new CustomError(error.message, 500)        
      }
    }
  },

  Mutation: {
    createDisposition: async(_,{input},{user, pubsub, PUBSUB_EVENTS}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();  
        end.setHours(23, 59, 59, 999);
        
        const [customerAccount, dispoType, userProdRaw] = await Promise.all([
          CustomerAccount.findById(input.customer_account).populate( 'current_disposition'),
          DispoType.findById(input.disposition).lean(),
          Production.findOne({
            user: user._id,
            createdAt: { $gte: start, $lte: end }
          }),
        ]);
        const withPayment = ['PTP','PAID','UNEG']

        if (!customerAccount) {
          console.log(input.customer_account)
          throw new CustomError("Customer account not found", 404);
        }
        
        if (!dispoType) throw new CustomError("Disposition type not found", 400);
      
        if(!userProdRaw) await Production.create({ user: user._id });
   
        const isPaymentDisposition = dispoType.code === "PAID"

        if (withPayment.includes(dispoType.code) && !input.amount) {
          console.log(dispoType.code)
          throw new CustomError("Amount is required", 401);
        }
        
        const ptp = (customerAccount?.current_disposition && customerAccount?.current_disposition.ptp === true) || dispoType.code === "PTP";

        const payment = customerAccount.balance - parseFloat(input.amount || 0) === 0 ? "full" : 'partial';

   

        const newDisposition = new Disposition({
          ...input,
          payment: withPayment.includes(dispoType.code) ? payment : null,
          amount: parseFloat(input.amount) || 0, 
          user: user._id, 
          ptp: ptp
        })

        const group = customerAccount.assigned ? await Group.findById(customerAccount.assigned).lean() : null
        const assigned = group ? group.members : customerAccount.assigned ? [customerAccount.assigned] : [];

        await pubsub.publish(PUBSUB_EVENTS.DISPOSITION_UPDATE, {
          dispositionUpdated: {
            members: [...new Set([...assigned, user._id.toString() ])],
            message: "NEW_DISPOSITION"
          },
        });
        
        const updateFields = {
          current_disposition: newDisposition._id,
          assigned: null,
          assigned_date: null,
          on_hands: false,
        };
       
        if (isPaymentDisposition && input.amount) {
          const paid = customerAccount.paid_amount || 0;
          const totalOS = customerAccount.out_standing_details?.total_os || 0;
          const newBalance = dispoType.code === "PAID" ? (totalOS - paid - parseFloat(input.amount)).toFixed(2) : 0;
      
          Object.assign(updateFields, {
            paid_amount: paid + parseFloat(input.amount),
            balance: newBalance,
          });
        }

        await newDisposition.save()

        if(customerAccount?.current_disposition) {
          await Disposition.findByIdAndUpdate(customerAccount.current_disposition._id, {$set: { existing: false }});
        }

        await CustomerAccount.findByIdAndUpdate(customerAccount._id, { $set: updateFields, $push: { history: newDisposition._id } },{new: true});
        
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
