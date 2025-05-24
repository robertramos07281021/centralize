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


        const accounts = await CustomerAccount.aggregate([
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer_info",
            },
          },
          { $unwind: { path: "$customer_info", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          { $unwind: { path: "$account_bucket", preserveNullAndEmptyArrays: true } },
          {
            $match: {
              "account_bucket._id": {$in: user.buckets},
              on_hands: false,
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
        ])
        return accounts
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
     
    },
    findCustomerAccount: async(_,{disposition, groupId ,page, assigned, limit}, {user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        let selected = ''
        if (groupId) {
          const [group, userSelected] = await Promise.all([
            Group.findById(groupId),
            User.findById(groupId),
          ]);
          selected = group?._id || userSelected?._id || null;
        }
        const bucket = user.buckets
        const search = [
          { "account_bucket._id": { $in: bucket } },
        ];
    
        if (disposition.length > 0) {
          search.push({ "dispoType.name": { $in: disposition } });
        }
    
        if (assigned === "assigned") {
          search.push({ assigned: selected ?? { $ne: null } });
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
          { $unwind: { path: "$customer_info", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          { $unwind: { path: "$account_bucket", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "currentDisposition",
            }
          },
          { $unwind: { path: "$currentDisposition", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "dispotypes",
              localField: "currentDisposition.disposition",
              foreignField: "_id",
              as: "dispoType",
            }
          },
          { $unwind: { path: "$dispoType", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "currentDisposition.user",
              foreignField: "_id",
              as: "disposition_user",
            }
          },
          { $unwind: { path: "$disposition_user", preserveNullAndEmptyArrays: true } },
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
          }
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
    selectAllCustomerAccount: async(_,{disposition,groupId,assigned},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401) 
      try {
        let selected = ''
        if(groupId) {
          const group = await Group.findOne({_id: groupId})
        
          const userSelected = await User.findOne({_id: groupId})
          selected = group ? group._id : userSelected._id
        }
        
        const bucket = user.buckets
        let search = []
        if(Boolean(disposition.length > 0 && groupId)){
          search = [{"account_bucket._id": {$in: bucket}},{"dispoType.name": {$in: disposition }}, {assigned: assigned == "assigned" ? selected : null}]
        } else if (Boolean(disposition.length === 0 && !groupId)) {
          search = [{"account_bucket._id": {$in: bucket}}, {assigned: assigned == "assigned" ? {$ne: null} : null}]
        } else if (disposition.length > 0 && !groupId) {
          search = [{"account_bucket._id": {$in: bucket}},{"dispoType.name": {$in: disposition }},{assigned: assigned == "assigned" ? selected : null}]
        } else if(Boolean(disposition.length === 0 && groupId)) {
          search = [{"account_bucket._id": {$in: bucket}},{assigned: assigned == "assigned" ? selected : null}]
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
        console.log(error)
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
    createCustomer: async(_,{input,callfile},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const dept = await Department.find({_id: {$in: user.departments}}).distinct('name')

        const buckets = new Set(await Bucket.find({dept: {$in: dept}}).distinct('name'))
        
        const inputBucket = new Set(input.map((i) => i.bucket))

        for (const name of inputBucket) {
          if (!buckets.has(name)) {
            throw new CustomError(`Bucket '${name}' is not included in user's access`, 403);
          }
        }
        
        const createdCallfile = await Callfile.create({name: callfile})

        await Promise.all(input.map(async (element) => {
          const bucket = await Bucket.findOne({ name: element.bucket });
          if (!bucket) throw new CustomError("Bucket not found", 404);
    
          let customer = await Customer.findOne({ platform_customer_id: element.platform_user_id });
          if (!customer) {
            customer = new Customer({
              fullName: element.customer_name,
              platform_customer_id: element.platform_user_id,
              gender: element.gender,
              dob: element.birthday,
              addresses: [element.address],
              emails: [element.email],
              contact_no: ["0" + element.one],
            });
            await customer.save();
          }
          let findCA = await CustomerAccount.findById(customer)
          if(findCA) {
            findCA.callfile.push(createdCallfile._id)
            await findCA.save()
          } else {
            await CustomerAccount.create({
              customer: customer._id,
              bucket: bucket._id,
              case_id: element.case_id,
              callfile: [createdCallfile._id],
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
          }
        }));
      } catch (error) {
        throw new CustomError(error.message, 500)
      }

    },
    updateCustomer: async(_,{fullName, dob, gender, addresses, mobiles, emails, id},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const customer = await Customer.findByIdAndUpdate(id,{
          $set: {
            fullName, dob, gender, addresses, emails, contact_no: mobiles
          }
        }, {new: true}) 
        if(!customer) throw new CustomError("Customer not found",404)
        return {success: true, message: "Customer successfully updated", customer: customer }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  }
}

export default customerResolver
