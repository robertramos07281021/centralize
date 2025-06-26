
import CustomError from "../../middlewares/errors.js"
import Bucket from "../../models/bucket.js"
import Customer from "../../models/customer.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"
import Group from "../../models/group.js"
import { PubSub } from "graphql-subscriptions"
import User from "../../models/user.js"
const pubsub = new PubSub()
const SOMETHING_CHANGED_TOPIC = "SOMETHING_CHANGED_TOPIC";

const taskResolver = {
  Query: {
    myTasks: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const myTask = await CustomerAccount.find({$and : [{assigned: user._id},{ on_hands: false}]}) 
        return myTask
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    groupTask: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try { 
        const myGroup = await Group.findOne({members: user._id})
        if(!myGroup) return {
          _id: null,
          task: []
        }

        const customerAccounts = await CustomerAccount.find({$and: [{assigned: myGroup._id},{on_hands: false}]})

        return {
          _id: myGroup._id,
          task: customerAccounts
        }

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
        return bucket
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
        if(!ca) throw new CustomError("Customer account not found", 404) 
      
        const findGroup = await Group.findById(ca.assigned)
 
        const assigned = ca.assigned ? (findGroup ? findGroup.members : [user._id]) : []

        if(ca.on_hands) throw new CustomError("Already taken")

        ca.on_hands = true

        await ca.save()
        
        await pubsub.publish(SOMETHING_CHANGED_TOPIC, {
          somethingChanged: {
            members: [...new Set([...assigned,user._id])],
            message: "TASK_SELECTION"
          },
        });

        return {
          success: true,
          message: "Successfully selected"
        }
      } catch (error) {
        throw new CustomError(error.message, 500)  
      }

    } ,
    deselectTask: async(_,{id}) => {
      try {
        const ca = await CustomerAccount.findByIdAndUpdate(id,{$set: {on_hands: false}},{new: true})
        if(!ca) throw new CustomError("Customer account not found", 404) 
      
        const group = await Group.findById(ca.assigned)
      
        const assigned = ca?.assigned ? (group ? [...group.members] : [ca.assigned]) : []

        await pubsub.publish(SOMETHING_CHANGED_TOPIC, {
          somethingChanged: {
            members: assigned,
            message: "TASK_SELECTION"
          },
        });

        return {
          success: true,
          message: "Successfully deselected"
        }
      } catch (error) {
        throw new CustomError(error.message, 500)  
      }
    },
    tlEscalation: async(_,{id}) => {
      try {
        const escalateToTL = await CustomerAccount.findById(id)
        if(!escalateToTL) throw new CustomError('Customer not found', 404)
        const findUser = await User.find({buckets: escalateToTL.bucket})
        const filterTL = findUser.find(e=> e.type === "TL" )

        await CustomerAccount.updateOne({_id: id},{$set: {assigned: filterTL._id}})
        
        await pubsub.publish(SOMETHING_CHANGED_TOPIC, {
          somethingChanged: {
            members: [filterTL._id],
            message: "TASK_SELECTION"
          },
        });
    
        
        return {
          success: true,
          message: "Successfully transfer to team leader"
        }
      } catch (error) {
        throw new CustomError(error.message, 500)          
      }
    }
  },
  Subscription: {
    somethingChanged: {
      subscribe:() => pubsub.asyncIterableIterator([SOMETHING_CHANGED_TOPIC])
    },

  }
}

export default taskResolver