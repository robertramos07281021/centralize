import CustomError from "../../middlewares/errors.js"
import Bucket from "../../models/bucket.js"
import Customer from "../../models/customer.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"
import Group from "../../models/group.js"

const taskResolver = {
  Query: {
    myTasks: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const myTask = await CustomerAccount.find({assigned: user._id}) 
        return myTask
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    groupTask: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try { 
        const myGroup = await Group.findOne({members: user._id})
        if(!myGroup) throw new CustomError("Group not found", 404)

        const customerAccounts = await CustomerAccount.find({$and: [{assigned: myGroup._id},{on_hands: false}]})
        
        return customerAccounts

      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
  MyTasks: {
    customer_info: async(parent)=> {
      try {
        const customerInfo = await Customer.findById(parent.customer)
        if(!customerInfo) throw new CustomError("Customer not found", 404)
        return {
          _id:customerInfo._id,
          fullName:customerInfo.fullName,
          dob: customerInfo.dob,
          gender: customerInfo.gender,
          contact_no: customerInfo.contact_no,
          emails: customerInfo.emails,
          addresses: customerInfo.addresses
        }
      } catch (error) {
        throw new CustomError(error.message, 500)  
      }
    },
    account_bucket: async(parent) => {
      try {
        const bucket = await Bucket.findById(parent.bucket)
        if(!bucket) throw new CustomError("Bucket not found", 404)
        return {
          name: bucket.name,
          dept: bucket.dept
        }
      } catch (error) {
        throw new CustomError(error.message, 500)  
      }
    },
    current_disposition: async(parent) => {
      try {
        const disposition = await Disposition.findById(parent.current_disposition).populate('disposition')

        return {
          disposition: disposition ? disposition.disposition.name : null,
        }
      } catch (error) {
        throw new CustomError(error.message, 500)  
      }
    },
    
  },
  Mutation: {
    selectTask: async(_,{id}, {user})=>{
      if(!user) throw new CustomError("Unauthorized",401)
      try {


        const ca = await CustomerAccount.findById(id)
        if(ca.on_hands) throw new CustomError("Already taken")

        ca.on_hands = true

        await ca.save()
        if(!ca) throw new CustomError("Customer account not found", 404) 
        return {
          success: true,
          message: "Successfully selected"
        }
      } catch (error) {
        throw new CustomError(error.message, 500)  
      }

    } ,
    deselectTask: async(_,{id},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const ca = await CustomerAccount.findByIdAndUpdate(id,{$set: {on_hands: false}})
        if(!ca) throw new CustomError("Customer account not found", 404) 
  
        return {
          success: true,
          message: "Successfully deselected"
        }
      } catch (error) {
        throw new CustomError(error.message, 500)  
      }
    }
  },
}

export default taskResolver