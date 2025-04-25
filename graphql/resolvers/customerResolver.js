import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Bucket from "../../models/bucket.js";
import Customer from "../../models/customer.js";
import CustomerAccount from "../../models/customerAccount.js";
import DispoType from "../../models/dispoType.js";
import Group from "../../models/group.js";
import ModifyRecord from "../../models/modifyRecord.js";
import mongoose from "mongoose";

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
    search: async(_,{search}) => {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(search);
      const checkId = isValidObjectId ? new mongoose.Types.ObjectId(search) : null;

      try {
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
              $or: [
                { "customer_info.fullName": { $regex: search, $options: "i" } },
                { "customer_info.dob": { $regex: search, $options: "i" } },
                { "customer_info.contact_no": { $elemMatch: { $regex: search, $options: "i" } } },
                { "customer_info.emails": { $elemMatch: { $regex: search, $options: "i" } } },
                { "customer_info.addresses": { $elemMatch: { $regex: search, $options: "i" } } },
                { credit_customer_id: { $regex: search} },
                { account_id: { $regex: search, $options: "i" } },
                { "out_standing_details.total_os": { $regex: search, } },
                { case_id: { $regex: search, $options: "i" } },
                ...(checkId ? [{ "customer_info._id": checkId }] : []),
              ],
            },
          },
        ])
  
        return [...accounts]
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
     
    },
    findCustomerAccount: async(_,{disposition, groupId ,page, assigned}, {user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const bucket = (await Bucket.find({dept: user.department})).map(e => e.name)
        let search = []
        if(Boolean(disposition.length > 0 && groupId)){
          search = [{"account_bucket.name": {$in: bucket}},{"dispoType.name": {$in: disposition }}, {assigned: assigned == "assigned" ? new mongoose.Types.ObjectId(groupId) : null}]
        } else if (Boolean(disposition.length === 0 && !groupId)) {
          search = [{"account_bucket.name": {$in: bucket}}, {assigned: assigned == "assigned" ? {$ne: null} : null}]
        } else if (disposition.length > 0 && !groupId) {
          search = [{"account_bucket.name": {$in: bucket}},{"dispoType.name": {$in: disposition }},{assigned: assigned == "assigned" ? new mongoose.Types.ObjectId(groupId) : null}]
        } else if(Boolean(disposition.length === 0 && groupId)) {
          search = [{"account_bucket.name": {$in: bucket}},{assigned: assigned == "assigned" ? new mongoose.Types.ObjectId(groupId) : null}]
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
                { $skip: (page - 1) * 20 },
                { $limit: 20 }
              ],
              total: [{$count: "totalCustomerAccounts"}]
            }
          }
        ])
        return {
          CustomerAccounts: [...accounts[0]?.FindCustomerAccount],
          totalCountCustomerAccounts: accounts[0]?.total[0]?.totalCustomerAccounts > 0 ? accounts[0]?.total[0]?.totalCustomerAccounts : 0
        }
        
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    selectAllCustomerAccount: async(_,{disposition,groupId,assigned},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401) 
      try {
        const bucket = (await Bucket.find({dept: user.department})).map(e => e.name)
        let search = []
        if(Boolean(disposition.length > 0 && groupId)){
          search = [{"account_bucket.name": {$in: bucket}},{"dispoType.name": {$in: disposition }}, {assigned: assigned == "assigned" ? new mongoose.Types.ObjectId(groupId) : null}]
        } else if (Boolean(disposition.length === 0 && !groupId)) {
          search = [{"account_bucket.name": {$in: bucket}}, {assigned: assigned == "assigned" ? {$ne: null} : null}]
        } else if (disposition.length > 0 && !groupId) {
          search = [{"account_bucket.name": {$in: bucket}},{"dispoType.name": {$in: disposition }},{assigned: assigned == "assigned" ? new mongoose.Types.ObjectId(groupId) : null}]
        } else if(Boolean(disposition.length === 0 && groupId)) {
          search = [{"account_bucket.name": {$in: bucket}},{assigned: assigned == "assigned" ? new mongoose.Types.ObjectId(groupId) : null}]
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
        return group[0] ? group[0] : null
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
  
  
  Mutation: {
    createCustomer: async(_,{input},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const buckets = await Bucket.find({dept: user.department})
        const bucketsNames = buckets.map((bucket) => bucket.name)
        const inputBucket = [...new Set(input.map((i) => i.bucket))]

        Array.from(inputBucket).forEach((ib) => {
          if(!bucketsNames.includes(ib)) {
            throw new CustomError("Not Included")
          }
        })

        Array.from(input).forEach(async(element)=> {
          const bucket = await Bucket.findOne({name : element.bucket})
          if(!bucket) throw new CustomError("Bucket not found",404)
          const findCustomer = await Customer.findOne({platform_customer_id: element.platform_user_id})
          if(!findCustomer) {
            const customer = await Customer.create({
              fullName: element.customer_name,
              platform_customer_id: element.platform_user_id,
              gender: element.gender,
              dob: element.birthday
            })
            customer.addresses.push(element.address)
            customer.emails.push(element.email)
            customer.contact_no.push("0" + element.one)
            await customer.save()
  
            await CustomerAccount.create({
              customer: customer._id,
              bucket: bucket._id,
              case_id: element.case_id,
              credit_customer_id: element.credit_user_id,
              endorsement_date: element.endorsement_date,
              bill_due_day: element.bill_due_day,
              max_dpd: element.max_dpd,
              balance: element.total_os,
              paid_amount: 0,
              account_id: element.account_id || null,
              "out_standing_details.principal_os" : element.principal_os,
              "out_standing_details.interest_os" : element.interest_os,
              "out_standing_details.admin_fee_os" : element.admin_fee_os,
              "out_standing_details.txn_fee_os" : element.txn_fee_os,
              "out_standing_details.late_charge_os" : element.late_charge_os,
              "out_standing_details.dst_fee_os" : element.dst_fee_os,
              "out_standing_details.total_os": element.total_os,
              "grass_details.grass_region": element.grass_region,
              "grass_details.vendor_endorsement": element.vendor_endorsement,
              "grass_details.grass_date": element.grass_date
            })
          }
          return {success: true, message: "successfully add"}
        })
      } catch (error) {
        throw new CustomError(error.message, 500)
      }

    },
    updateCustomer: async(_,{fullName, dob, gender, addresses, mobiles, emails, id},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const customer = await Customer.findByIdAndUpdate(id,{
          $set: {
            fullName, dob, gender, addresses, emails, contact_no:mobiles
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
