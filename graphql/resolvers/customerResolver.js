import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Bucket from "../../models/bucket.js";
import Customer from "../../models/customer.js";
import CustomerAccount from "../../models/customerAccount.js";
import DispoType from "../../models/dispoType.js";
import Group from "../../models/group.js";
import ModifyRecord from "../../models/modifyRecord.js";
import mongoose from "mongoose";
import User from "../../models/user.js";
import Department from "../../models/department.js";
import Callfile from "../../models/callfile.js";
import Disposition from "../../models/disposition.js";

const customerResolver = {
  DateTime,
  Query: {
    getModifyReport: async(_,{id}) => {
      try {
        return await ModifyRecord.find({user: id}) 
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    findCustomer: async(_,{fullName, dob, email, contact_no}) => {
      {
        try {
          const searchQuery = await Customer.aggregate([
            {
              $match: [
                {fullName : {$regex: fullName, $options: "i"}},
                {dob : {$regex: dob, $options: "i"}},
                {email : { $elemMatch : { $regex: email, $options: "i"} }},
                {contact_no :{ $elemMatch: {$regex: contact_no, $options: "i"}} },
              ]
            }
          ])
          return searchQuery
        } catch (error) {
          throw new CustomError(error.message, 500)
        }
      }
    },
    getCustomers: async(_,{page}) => {
      try {
        const customers = await Customer.aggregate([
          {
            $facet: {
              customers: [
                { $skip: (page - 1) * 20 },
                { $limit: 20 }
              ],
              total: [
                {$count: "totalCustomers"}
              ]
            }
          }
        ])
        return {
          customers: customers[0].customers ?? [],
          total: customers[0].total.length > 0 ? customers[0].total[0].totalCustomers : 0,
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    search: async(_,{search},{user}) => {
      
      try {
        const regexSearch = { $regex: search, $options: "i" };
        const startOfTheDay = new Date()
        startOfTheDay.setHours(0,0,0,0)
        const endOfTheDay = new Date()
        endOfTheDay.setHours(23,59,59,999)
        const success = ['PTP','UNEG','FFUP','KOR','NOA','FV','HUP','LM','ANSM','DEC','RTP','ITP','PAID']


        const accounts = await Customer.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "ca",
            },
          },
          { 
            $unwind: { path: "$ca", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "buckets",
              localField: "ca.bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          { 
            $unwind: { path: "$account_bucket", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "callfiles",
              localField: "ca.callfile",
              foreignField: "_id",
              as: "account_callfile",
            },
          },
          { 
            $unwind: { path: "$account_callfile", preserveNullAndEmptyArrays: true } 
          },
          {
            $match: {
              "account_bucket._id": {$in: user.buckets},
              "ca.on_hands": false,
              "account_callfile.active": {$eq: true},
              "account_callfile.endo": {$exists: false},
              $or: [
                { fullName: regexSearch },
                { contact_no: { $elemMatch: regexSearch } },
                { emails: { $elemMatch: regexSearch } },
                { addresses: { $elemMatch: regexSearch } },
              ],
            },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "ca.current_disposition",
              foreignField: "_id",
              as: "cd",
            },
          },
          { 
            $unwind: { path: "$cd", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "cd.disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          { 
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "users",
              localField: "cd.user",
              foreignField: "_id",
              as: "user",
            },
          },
          { 
            $unwind: { path: "$user", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "ca.history",
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
                      { $gte: ["$cd.createdAt", startOfTheDay] },
                      { $lte: ["$cd.createdAt", endOfTheDay] }
                    ]
                  },
                  then: true,
                  else: false
                }
              }
            }
          },
          {
            $project: {
              _id: "$ca._id",
              customer_info: {
                fullName: "$fullName",
                dob: "$dob",
                gender: "$gender",
                contact_no: "$contact_no",
                emails: "$emails",
                addresses: "$addresses",
                isRPC: "$isRPC",
                _id: "$_id"
              },
              case_id: "$ca.case_id",
              account_id: "$ca.account_id",
              endorsement_date: "$ca.endorsement_date",
              credit_customer_id: "$ca.credit_customer_id",
              bill_due_day: "$ca.bill_due_day",
              max_dpd: "$ca.max_dpd",
              month_pd: "$ca.month_pd",
              balance: "$ca.balance",
              paid_amount: "$ca.paid_amount",
              isRPCToday: "$isRPCToday",
              dispo_history: "$dispo_history",
              out_standing_details: "$ca.out_standing_details",
              grass_details: "$ca.grass_details",
              account_bucket: "$account_bucket",
              emergency_contact: "$ca.emergency_contact"
            }
          }
        ])

        return accounts
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getMonthlyPerformance: async(_,__,{user}) => {
      try {
        const year = new Date().getFullYear()
        const month = new Date().getMonth();
        const thisDay = new Date()
        thisDay.setHours(0,0,0,0)
        const firstDay = new Date(year,month, 1)
        const lastDay = new Date(year,month + 1,0)
        const aomCampaign = await Department.find({aom: user._id}).lean()
        const aomCampaignNameArray = aomCampaign.map(e => e.name)
        const campaignBucket = await Bucket.find({dept: {$in: aomCampaignNameArray}}).lean()
        const newArrayCampaignBucket = campaignBucket.map(e=> e._id)


        const dispositionCheck = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gte:firstDay , $lt:lastDay },
            }
          },
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "ca",
            },
          },
          { 
            $unwind: { path: "$ca", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "buckets",
              localField: "ca.bucket",
              foreignField: "_id",
              as: "bucket",
            },
          },
          { 
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true } 
          },
          {
            $match: {
              "bucket.dept": {$in: aomCampaignNameArray}
            }
          },
          {
            $group: {
              _id: {
                campaign: "$bucket.dept",
                day: { $dayOfMonth: "$createdAt" },
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" }
              },
              users: {
                $addToSet: "$user"
              }
            }
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id.campaign",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day"
                }
              },
              users:{ $size: "$users" }
            }
          }
        ])

        const dispo = await Promise.all(
          dispositionCheck.map(async(e)=> 
          {
             const users = await User.aggregate([
              {
                $match: {
                  type: "AGENT"
                }
              },
              {
                $lookup: {
                  from: "departments",
                  localField: "departments",
                  foreignField: "_id",
                  as: "department",
                }
              },
              { 
                $unwind: { path: "$department", preserveNullAndEmptyArrays: true } 
              },
              {
                $match: {
                  "department.name": e.campaign 
                }
              },
            ])
            return {
              campaign: e.campaign,
              rate: users.length === 0 ? 0 : (e.users / users.length * 100)
            }
          }
          )
        )

        const connectedDispo = ['FFUP','PAID','PRC','RPCCB','FV','LM','PTP','UNEG','DEC','ITP','RTP']

        const accounts = await CustomerAccount.aggregate([
          {
            $match: {
              createdAt: { $gte:firstDay , $lt:lastDay },
            }
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
            $match: {
              "account_bucket._id": { $in: newArrayCampaignBucket }
            }
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "currentDisposition",
            }
          },
          { 
            $unwind: { path: "$currentDisposition", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "currentDisposition.disposition",
              foreignField: "_id",
              as: "dispotype",
            }
          },
          { 
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } 
          },
          {
            $group: {
              _id: "$account_bucket.dept",
              totalAccounts: {
                $sum: 1
              },
              connectedAccounts: {
                $sum: {
                  $cond: [
                    {
                      $in: ["$dispotype.code",connectedDispo]
                    }
                    ,1
                    ,0
                  ]
                }
              },
              targetAmount: {
                $sum: "$out_standing_details.total_os"
              },
              collectedAmount: {
                $sum: "$paid_amount"
              },
     
              ptpKeptAccount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispotype.code","PAID"]
                        },
                        {
                          $eq: ['$dispotype.ptp',true]
                        }
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              paidAccount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispotype.code","PAID"]
                        },
                        {
                          $eq: ['$currentDisposition.ptp',false]
                        }
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              totalAccounts: 1,
              connectedAccounts: 1,
              targetAmount: 1,
              collectedAmount: 1,
              ptpKeptAccount: 1,
              paidAccount: 1,
            }
          }
        ])


        const newResult = accounts.map((com)=> {
          const findDept = aomCampaign.find(e => e.name === com.campaign)
          const camp = dispo.filter(x=> x.campaign === com.campaign).map(y => y.rate)
          const sumOfCamp =camp.length > 0 ? camp.reduce((t,v) => { return t + v }) : 0
          

          return {
            ...com,
            campaign: findDept ? findDept._id.toString() : com.campaign,
            attendanceRate: camp.length > 0 ? sumOfCamp/camp.length : 0
          }
        })
        
        return newResult
      } catch (error) {
        throw new CustomError(error.message, 500)        
      }
    },
    findCustomerAccount: async(_,{query}, {user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)

        const {disposition, groupId ,page, assigned, limit, selectedBucket, dpd} = query

        let selected = ''
        if (groupId) {
          const [group, userSelected] = await Promise.all([
            Group.findById(groupId).lean(),
            User.findById(groupId).lean()
          ]);
     
          selected = group?._id || userSelected?._id || null;
        }
        const activeCallfile = await Callfile.findOne({bucket: new mongoose.Types.ObjectId(selectedBucket),active: {$eq: true}})
  
        
        const search = [
          { "existingDispo.code" : { $ne: 'DNC' } },
          {balance: {$ne: 0}}
        ];
     
        if(dpd) {
          search.push({max_dpd: {$eq: dpd}})
        }

        if (disposition && disposition.length > 0) {
          search.push({ "existingDispo.code": { $in: disposition } });
        }
        
        if (assigned === "assigned") {
          if (selected) {
            search.push({ assigned: new mongoose.Types.ObjectId(selected) });
          } else {
            search.push({ assigned: { $ne: null } });
          }
        } else {
          search.push({ assigned: null });
        }
  
        const accounts = await CustomerAccount.aggregate([
          {
            $match: {
              callfile: activeCallfile._id
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
              as: "cd"
            }
          },
          {
            $unwind: { path: "$ca_disposition", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "cd.disposition",
              foreignField: "_id",
              as: "dispotype"
            }
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "history",
              foreignField: "_id",
              as: "histories"
            }
          },
          {
            $lookup: {
              from: "dispotypes",
              let: {
                dispoIds: {
                  $map: {
                    input: { $ifNull: ["$histories", []] },
                    as: "h",
                    in: "$$h.disposition"
                  }
                }
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ["$_id", "$$dispoIds"]
                    }
                  }
                },
                { $project: { name: 1, code: 1, rank: 1 , status: 1} }
              ],
              as: "dispotypesData"
            }
          },
          {
            $set: {
              mainDispotype: {
                $let: {
                  vars: {
                    ranked: {
                      $filter: {
                        input: "$dispotypesData",
                        as: "d",
                        cond: { $gt: ["$$d.rank", 0] }
                      }
                    },
                    all: "$dispotypesData"
                  },
                  in: {
                    $cond: [
                      { $gt: [{ $size: "$$ranked" }, 0] },
                      {
                        $let: {
                          vars: {
                            best: {
                              $reduce: {
                                input: "$$ranked",
                                initialValue: null,
                                in: {
                                  $cond: [
                                    {
                                      $lt: [
                                        "$$this.rank",
                                        { $ifNull: ["$$value.rank", Infinity] }
                                      ]
                                    },
                                    "$$this",
                                    "$$value"
                                  ]
                                }
                              }
                            }
                          },
                          in: "$$best"
                        }
                      },
                      { $first: "$$all" }
                    ]
                  }
                }
              }
            }
          },
          {
            $addFields: {
              checkRanking: {
                $filter: {
                  input: '$dispotypesData',
                  as: 'dd',
                  cond: {$gt: ['$$dd.rank',0]}
                }
              },
            }
          },
          {
            $addFields: {
              existingDispo: {
                $cond: [
                  {
                    $expr: {$gt: [{$size: "$history"},0]}
                  },
                  {
                    $cond: [
                      { $expr: { $gt: [ {$size: "$checkRanking"}, 0 ] } },
                      '$mainDispotype',
                      '$dispotype'
                    ]
                  },
                  null
                ]
              }
            }
          },
          {
            $match: {
              $and: search
            }
          },
          {
            $project: {
              _id: "$_id",
              customer_info: "$customer_info",
              dispoType: "$existingDispo",
              account_bucket: "$account_bucket",
              max_dpd:  "$max_dpd",
              assigned: "$assigned",
              balance: '$balance'
            }
          },
          {
            $facet: {
              FindCustomerAccount: [
                { $skip: (page - 1) * limit },
                { $limit: limit }
              ],
              AllCustomerAccounts: [
                {
                  $group: {
                    _id: null,
                    ids: { $push: "$_id" }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    ids: 1
                  }
                }
              ]
            }
          },
        ])


        const allAccounts = accounts[0]?.AllCustomerAccounts[0]?.ids || [];

        return {
          CustomerAccounts: accounts[0]?.FindCustomerAccount || [],
          totalCountCustomerAccounts: allAccounts ,
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    accountsCount: async(_,__,{user}) => {
      try {
        const aomDept = (await Department.find({aom: user._id}).lean()).map(dept=> dept.name)

        const deptBuckets = (await Bucket.find({dept: {$in:aomDept}}).lean()).map((e)=> e._id)

        return  await CustomerAccount.countDocuments({ bucket: { $in: deptBuckets } }) || 0
      } catch (error) {
        throw new CustomError(error.message, 500)        
      }
    },
    getMonthlyTarget: async(_,__,{user}) => {
      try {
        const [aomCampaign,dispoType] = await Promise.all([
          Department.find({aom: user._id}).lean(),
          DispoType.find().lean()
        ])

        
        const aomCampaignNameArray = aomCampaign.map(e => e.name)
        const campaignBucket = await Bucket.find({dept: {$in: aomCampaignNameArray}}).lean()
        const newArrayCampaignBucket = campaignBucket.map(e=> new mongoose.Types.ObjectId(e._id))
        const {_id} = dispoType.find(x => 
          x.code === 'PAID'
        )
        const ptp = dispoType.find(x=> x.code === 'PTP')

        
        const findActiveCallfile = await Callfile.find({
          $and: [
            {
              bucket: {$in: newArrayCampaignBucket}
            },
            {
              active: {$eq: true}
            }
          ]
        }).lean()
        

        const newMapCallfile = findActiveCallfile.map(x=> new mongoose.Types.ObjectId(x._id))

        const monthlyTarget = await CustomerAccount.aggregate([
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
              as: "currentDisposition",
            }
          },
          { 
            $unwind: { path: "$currentDisposition", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "currentDisposition.disposition",
              foreignField: "_id",
              as: "dispoType",
            }
          },
          { 
            $unwind: { path: "$dispoType", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "history",
              foreignField: "_id",
              as: "account_history",
            }
          },
          {
            $match: {
              callfile : {$in: newMapCallfile}
            }
          },
          {
            $addFields: {
              historyPTPKept: {
                $filter: {
                  input: "$account_history",
                  as: "h",
                  cond: {
                    $and: [
                      { $eq: [ "$$h.disposition", new mongoose.Types.ObjectId(_id) ] },
                      { $eq: [ "$$h.ptp", true ] },
                      { $eq: [ '$$h.exists',true ] },
                    ]
                  }
                }
              },
              historyPaidOnly: {
                $filter: {
                  input: "$account_history",
                  as: "h",
                  cond: {
                    $and: [
                      { $eq: [ "$$h.disposition", new mongoose.Types.ObjectId(_id) ] },
                      { $eq: [ "$$h.ptp", false ] }
                    ]
                  }
                }
              },
              hasPTP: {
                $anyElementTrue: {
                  $map: {
                    input: "$account_history",
                    as: "h",
                    in: {
                      $and: [
                        { $eq: [ "$$h.ptp", true ] },
                        { $eq: [ "$$h.disposition", new mongoose.Types.ObjectId(ptp._id) ] }
                      ],
                    }
                  }
                }
              }
            },
          },
          {
            $addFields: {
              ptpKeptHistoryCount: { $size: "$historyPTPKept" },
              ptpKeptAmount: {
                $sum: {
                  $map: {
                    input: "$historyPTPKept",
                    as: "item",
                    in: "$$item.amount"
                  }
                }
              },
              paidHistoryCount: { $size: "$historyPaidOnly" },
              paidHistoryAmount: {
                $sum: {
                  $map: {
                    input: "$historyPaidOnly",
                    as: "item",
                    in: "$$item.amount"
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: "$account_bucket.dept",
              ptpCount: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$dispoType.code','PTP']
                    },
                    1,
                    0
                  ]
                }
              },
              pkCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ['$dispoType.code','PAID']
                        },
                        {
                          $eq: ["$currentDisposition.ptp", true]
                        }
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              pCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ['$dispoType.code','PAID']
                        },
                        {
                          $eq: ["$currentDisposition.ptp", false]
                        }
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              ptp: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$dispoType.code','PTP']
                    }
                    ,
                    "$currentDisposition.amount",
                    0
                  ]
                }
              },
              pk: {$sum: "$ptpKeptAmount"},
              paid: {$sum: "$paidHistoryAmount"},
              collected: {$sum: "$paid_amount"},
              target: {$sum: "$out_standing_details.total_os"},
              isPTP: {$sum: {
                $cond: [
                  {
                    $eq: ['$hasPTP', true]
                  },
                  1,
                  0
                ],
              }}
            },
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              pk: 1,
              paid: 1,
              ptp: 1,
              isPTP: 1,
              ptpCount: 1,
              pkCount: 1,
              pCount: 1,
              collected: 1,
              target: 1,
              isPTP: 1
            }
          }
        ])

        const newMonthlyTarget = monthlyTarget.map(e=> {
          const campagin = aomCampaign.find(ac => e.campaign === ac.name)
          return {
            ...e,
            campaign: campagin ? campagin._id : null
          }
        })

        return newMonthlyTarget
      } catch (error) {
        throw new CustomError(error.message, 500)             
      }
    }
  },
  CustomerAccount: {
    assigned: async(parent)=> {
      try {
        const group = await Group.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(parent.assigned) 
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "members",
              foreignField: "_id",
              as: "members"
            }
          }
        ])

        if (group.length > 0) return group[0]

        const user = await User.findById(parent.assigned)
        return user

      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
  },

  Assigned: {
    __resolveType(obj) {
      if (obj.members) return 'Group';
      if (obj.user_id) return 'User';
      return null;
    }
  },
  
  Mutation: {
    createCustomer: async(_,{input, callfile, bucket},{user, pubsub, PUBSUB_EVENTS}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const findBucket = await Bucket.findById(bucket)
        if(!findBucket) throw new CustomError('Bucket not found',404)

        const newCallfile = new Callfile({name: callfile, bucket: findBucket._id, totalAccounts: input.length || 0})

        await Promise.all(input.map(async (element) => {
          const contact_no = []
          const addresses = []
          const emails = []
          if(element.contact) {
            contact_no.push(`${element.contact}`)
          }
          if(element.contact_2) {
            contact_no.push(`${element.contact_2}`)
          }
          if(element.contact_3) {
            contact_no.push(`${element.contact_3}`)
          }
          if(element.address) {
            addresses.push(element.address)
          }
          if(element.address_2) {
            addresses.push(element.address_2)
          }
          if(element.address_3) {
            addresses.push(element.address_3)
          }

          if(element.email) {
            emails.push(element.email)
          }
          if(element.email_2) {
            emails.push(element.email_2)
          }
          if(element.email_3) {
            emails.push(element.email_3)
          }
          const customer = new Customer({
            fullName: element.customer_name,
            platform_customer_id: element.platform_user_id || null,
            gender: element.gender || null,
            dob: element.birthday || null,
            addresses,
            emails,
            contact_no,
          });
        
          const paid_amount =  element.total_os - element.balance 

          const caResult = await CustomerAccount.create({
            customer: customer._id,
            bucket: findBucket._id,
            case_id: element.case_id,
            callfile: newCallfile._id,
            credit_customer_id: element.credit_user_id ,
            endorsement_date: element.endorsement_date,
            bill_due_day: element.bill_due_day,
            max_dpd: element.max_dpd || element.dpd,
            balance : element.balance,
            month_pd: element.mpd,
            paid_amount,
            account_id: element.account_id ,
            out_standing_details: {
              principal_os: element.principal_os,
              interest_os: element.interest_os,
              admin_fee_os: element.admin_fee_os,
              txn_fee_os: element.txn_fee_os,
              late_charge_os: element.late_charge_os,
              dst_fee_os: element.dst_fee_os,
              waive_fee_os: element.late_charge_waive_fee_os,
              total_os: element.total_os,
              total_balance: element.balance
            },
            emergency_contact: {
              name:element.emergencyContactName,
              mobile:element.emergencyContactMobile
            },
            grass_details: {
              grass_region: element.grass_region,
              vendor_endorsement: element.vendor_endorsement,
              grass_date: element.grass_date,
            }
          });
          
          customer.customer_account = caResult._id
          await customer.save()
        }));

        await newCallfile.save()

        await pubsub.publish(PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE, {
          newCallfile: {
            bucket: bucket,
            message: PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE
          },
        });
        
        return {
          success: true,
          message: "Callfile successfully created"
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    updateCustomer: async(_,{fullName, dob, gender, addresses, mobiles, emails, id, isRPC},{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const customer = await Customer.findByIdAndUpdate(id,{
          $set: {
            fullName, dob, gender, addresses, emails, contact_no: mobiles, isRPC
          },
          $push: {
            updatedBy: user._id
          }
        }, {new: true}) 
        if(!customer) throw new CustomError("Customer not found",404)
        return {success: true, message: "Customer successfully updated", customer }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    updateRPC: async(_,{id},{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const customer = await Customer.findByIdAndUpdate(id, {
          $set: {
            isRPC: true
          },
          $push: {
            updatedBy: user._id
          }
        },{new: true})
        if(!customer)throw new CustomError("Customer not found",404)
          return {success: true, message: "Customer successfully updated", customer}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
}

export default customerResolver
