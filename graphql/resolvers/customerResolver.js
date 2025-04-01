import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Bucket from "../../models/bucket.js";
import Customer from "../../models/customer.js";
import CustomerAccount from "../../models/customerAccount.js";
import ModifyRecord from "../../models/modifyRecord.js";

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
  },
  Mutation: {
    createCustomer: async(_,{input},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)

      Array.from(input).forEach(async(element)=> {
        try {
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
            customer.addresses.push({address: element.address})
            customer.emails.push({email: element.emails})
            customer.contact_no.push({mobile: element.one})
            await customer.save()
  
            await CustomerAccount.create({
              customer: customer._id,
              bucket: bucket._id,
              case_id: element.case_id,
              credit_customer_id: element.credit_user_id,
              endorsement_date: element.endorsement_date,
              bill_due_day: element.bill_due_day,
              max_dpd: element.max_dpd,
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
        } catch (error) {
          throw new CustomError(error.message, 500)
        }
      })
      return {success: true, message: "successfully add"}
    },
    updateCustomer: async(_,{fullName, dob, gender, address, mobile, email},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      
      try {
        const customer = await Customer.findById(id) 
        if(!customer) throw new CustomError("Customer not found",404)
        await customer.updateOne({fullName, dob, gender})
        Array.from(address).forEach((element)=> {
          customer.addresses.push(element)
        })
        Array.from(email).forEach((element)=> {
          customer.emails.push(element)
        })
        Array.from(mobile).forEach((element)=> {
          customer.contact_no.push(element)
        })

        return {success: true, message: "Customer successfully updated"}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  }
}

export default customerResolver
