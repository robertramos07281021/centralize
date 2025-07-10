import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Bucket from "../../models/bucket.js";
import Customer from "../../models/customer.js";
import CustomerAccount from "../../models/customerAccount.js";
import DispoType from "../../models/dispoType.js";
import Group from "../../models/group.js";
import ModifyRecord from "../../models/modifyRecord.js";
import mongoose, { Mongoose } from "mongoose";
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
        const isValidObjectId = mongoose.Types.ObjectId.isValid(search);
        const checkId =  isValidObjectId ? [{ "customer_info._id": new mongoose.Types.ObjectId(search) }] : [];
        const regexSearch = { $regex: search, $options: "i" };

        const startOfTheDay = new Date()
        startOfTheDay.setHours(0,0,0,0)
        const endOfTheDay = new Date()
        endOfTheDay.setHours(23,59,59,999)
        const success = ['PTP','UNEG','FFUP','KOR','NOA','FV','HUP','LM','ANSM','DEC','RTP','ITP']

        const accounts = await CustomerAccount.aggregate([
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
              from: "callfiles",
              localField: "callfile",
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
              on_hands: false,
              "account_callfile.endo": {$exists: false},
              $or: [
                { "customer_info.fullName": regexSearch },
                { "customer_info.dob": regexSearch },
                { "customer_info.contact_no": { $elemMatch: regexSearch } },
                { "customer_info.emails": { $elemMatch: regexSearch } },
                { "customer_info.addresses": { $elemMatch: regexSearch } },
                { credit_customer_id: regexSearch },
                { account_id: regexSearch },
                { "out_standing_details.total_os": regexSearch },
                { case_id: regexSearch },
                ...checkId,
              ],
            },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
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
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } 
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "history",
              foreignField: "_id",
              as: "dispo_history",
            },
          },
          { 
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } 
          },
          {
            $addFields: {
              isRPCToday: {
                $cond: {
                  if: {
                    $and: [
                      { $in: ["$dispotype.code", success] },
                      {
                        $and: [
                          { $gte: ["$cd.createdAt", startOfTheDay] },
                          { $lte: ["$cd.createdAt", endOfTheDay] }
                        ]
                      }
                    ]
                  },
                  then: true,
                  else: false
                }
              }
            }
          },
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
    findCustomerAccount: async(_,{disposition, groupId ,page, assigned, limit, selectedBucket}, {user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        let selected = ''
        if (groupId) {
          const [group, userSelected] = await Promise.all([
            Group.findById(groupId).lean(),
            User.findById(groupId).lean(),
          ]);
          selected = group?._id || userSelected?._id || null;
        }
    

        const bucket = selectedBucket ? { $eq: new mongoose.Types.ObjectId(selectedBucket) } : { $in: user.buckets.map(e=> new mongoose.Types.ObjectId(e)) }
        
        const search = [
          { "account_bucket._id": bucket },
          { "dispoType.code" : {$nin: ["PAID","DNC"]} }
        ];
     
        if (disposition && disposition.length > 0) {
          search.push({ "dispoType.name": { $in: disposition } });
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
              from: "users",
              localField: "currentDisposition.user",
              foreignField: "_id",
              as: "disposition_user",
            }
          },
          { 
            $unwind: { path: "$disposition_user", preserveNullAndEmptyArrays: true } 
          },
          {
            $addFields: {
              paymentDate: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$currentDisposition.payment_date", null] },
                      { $ne: ["$currentDisposition.payment_date", ""] },
                      {
                        $in: [{ $type: "$currentDisposition.payment_date" }, ["string", "date"]]
                      }
                    ]
                  },
                  { $toDate: "$currentDisposition.payment_date" },
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
            $facet: {
              FindCustomerAccount: [
                { $skip: (page - 1) * limit },
                { $limit: limit }
              ],
              total: [{$count: "totalCustomerAccounts"}]
            }
          },
        ])

        const total = accounts[0]?.total[0]?.totalCustomerAccounts || 0;

        return {
          CustomerAccounts: accounts[0]?.FindCustomerAccount || [],
          totalCountCustomerAccounts: total,
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    selectAllCustomerAccount: async(_,{disposition,groupId,assigned, selectedBucket},{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401) 

        let selected = ''
        if(groupId) {
          const group = await Group.findOne({_id: groupId})
        
          const userSelected = await User.findOne({_id: groupId})
          selected = group ? group._id : userSelected._id
        }
        
        const searhBucket =selectedBucket ? {$eq: new mongoose.Types.ObjectId(selectedBucket) } :  {$in :user.buckets.map(e=> new mongoose.Types.ObjectId(e))}
        const search = [
          { "dispoType.code" : {$ne: "PAID"} },
          {"account_bucket._id": searhBucket }
        ]

        if (disposition && disposition.length > 0) {
          search.push({ "dispoType.name": { $in: disposition } });
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
            $addFields: {
              paymentDate: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$currentDisposition.payment_date", null] },
                      { $ne: ["$currentDisposition.payment_date", ""] },
                      {
                        $in: [{ $type: "$currentDisposition.payment_date" }, ["string", "date"]]
                      }
                    ]
                  },
                  { $toDate: "$currentDisposition.payment_date" },
                  null
                ]
              }
            }
          },
          {
            $match: {
              $and: search
            }
          }
        ])

        return accounts ? accounts.map(e => e._id) : []
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
        const year = new Date().getFullYear()
        const month = new Date().getMonth();
        const firstDay = new Date(year,month, 1)
        const lastDay = new Date(year,month + 1,0)
        const aomCampaign = await Department.find({aom: user._id}).lean()
        const aomCampaignNameArray = aomCampaign.map(e => e.name)
        const campaignBucket = await Bucket.find({dept: {$in: aomCampaignNameArray}}).lean()
        const newArrayCampaignBucket = campaignBucket.map(e=> e._id)

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
            $match: {
              "currentDisposition.createdAt" : {$gte: firstDay, $lt: lastDay},
              bucket: {$in: newArrayCampaignBucket}
            }
          },
          {
            $group: {
              _id: "$account_bucket.dept",
              collected: {$sum: "$paid_amount"},
              target: {$sum: "$out_standing_details.total_os"},
            }
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              collected: 1,
              target: 1
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

        const newCallfile = await Callfile.create({name: callfile, bucket: findBucket._id})

        await Promise.all(input.map(async (element) => {
          const contact_no = []
          const addresses = []
          const emails = []
          if(element.contact != "undefined") {
            contact_no.push(`0${element.contact}`)
          }
          if(element.contact_2 != "undefined") {
            contact_no.push(`0${element.contact_2}`)
          }
          if(element.contact_3 != "undefined") {
            contact_no.push(`0${element.contact_3}`)
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
              platform_customer_id: element.platform_user_id,
              gender: element.gender,
              dob: element.birthday,
              addresses,
              emails,
              contact_no,
            });
            await customer.save();
  
            await CustomerAccount.create({
              customer: customer._id,
              bucket: findBucket._id,
              case_id: element.case_id || "",
              callfile: newCallfile._id,
              credit_customer_id: element.credit_user_id,
              endorsement_date: element.endorsement_date,
              bill_due_day: element.bill_due_day,
              max_dpd: element.max_dpd,
              balance: element.total_os,
              paid_amount: 0,
              account_id: element.account_id || null,
              out_standing_details: {
                principal_os: element.principal_os,
                interest_os: element.interest_os,
                admin_fee_os: element.admin_fee_os,
                txn_fee_os: element.txn_fee_os,
                late_charge_os: element.late_charge_os,
                dst_fee_os: element.dst_fee_os,
                total_os: element.total_os,
              },
              grass_details: {
                grass_region: element.grass_region,
                vendor_endorsement: element.vendor_endorsement,
                grass_date: element.grass_date,
              }
          });
          
        }));

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
