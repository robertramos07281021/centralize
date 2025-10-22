import mongoose from "mongoose"
import CustomError from "../../middlewares/errors.js"
import Bucket from "../../models/bucket.js"
import Customer from "../../models/customer.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"
import DispoType from "../../models/dispoType.js"
import Group from "../../models/group.js"
import User from "../../models/user.js"
import Callfile from "../../models/callfile.js"
import Selective from "../../models/selective.js"

const taskResolver = {
  Query: {
    myTasks: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const myTask = await CustomerAccount.aggregate([
          {
            $match:
              {
                assigned: new mongoose.Types.ObjectId(user._id),
                on_hands: false,
                bucket: {$in: user.buckets.map(x => new mongoose.Types.ObjectId(x))}
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
              "account_callfile.active": true
            }
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
              localField: "user",
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
              localField: "history",
              foreignField: "_id",
              as: "dispo_history",
            },
          },
          {
            $project: {
              _id: "$_id",
              customer_info: "$customer_info",
              case_id: "$case_id",
              account_id: "$account_id",
              endorsement_date: "$endorsement_date",
              credit_customer_id: "$credit_customer_id",
              bill_due_date: "$bill_due_date",
              max_dpd: "$max_dpd",
              dpd: "$dpd",
              month_pd: "$month_pd",
              balance: "$balance",
              paid_amount: "$paid_amount",
              isRPCToday: "$isRPCToday",
              dispo_history: "$dispo_history",
              out_standing_details: "$out_standing_details",
              grass_details: "$grass_details",
              account_bucket: "$account_bucket",
              assigned: "$assigned",
              current_disposition: "$cd",
              account_update_history: '$account_update_history',
              assignedModel: "$assignedModel",
              assigned_date: "$assigned_date",
              emergency_contact: "$emergency_contact"
            }
          }
        ])

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
       
        const customerAccounts = await CustomerAccount.aggregate([
          {
            $match: {
              assignedModel: "Group",
              assigned: new mongoose.Types.ObjectId(myGroup._id),
              on_hands: false
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
              "account_callfile.active": true
            }
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
            $unwind: { path: "$user", preserveNullAndEmptyArrays: true } 
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
            $project: {
              _id: "$_id",
              customer_info: "$customer_info",
              case_id: "$case_id",
              account_id: "$account_id",
              endorsement_date: "$endorsement_date",
              credit_customer_id: "$credit_customer_id",
              bill_due_date: "$bill_due_date",
              max_dpd: "$max_dpd",
              dpd: "$dpd",
              month_pd: "$month_pd",
              balance: "$balance",
              paid_amount: "$paid_amount",
              isRPCToday: "$isRPCToday",
              dispo_history: "$dispo_history",
              out_standing_details: "$out_standing_details",
              grass_details: "$grass_details",
              account_bucket: "$account_bucket",
              assigned: "$assigned",
              account_update_history: '$account_update_history',
              current_disposition: "$cd",
              assigned_date: "$assigned_date",
              emergency_contact: "$emergency_contact"
            }
          }
        ])


        return {
          _id: myGroup._id,
          task: customerAccounts
        }

      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
  Mutation: {
    selectTask: async(_,{id}, {user, pubsub, PUBSUB_EVENTS})=>{
      try {
        if(!user) throw new CustomError("Unauthorized",401)
    
        const ca = await CustomerAccount.findById(id)
        if(!ca) throw new CustomError("Customer account not found", 404) 
      
        const findGroup = await Group.findById(ca.assigned)
 
        const assigned = ca.assignedModel ? (ca.assignedModel === 'Group' ? findGroup.members : [ca.assigned]) : []

        if(ca.on_hands) throw new CustomError("Already taken")

        ca.on_hands = true

        await ca.save()
 
        await pubsub.publish(PUBSUB_EVENTS.SOMETHING_CHANGED_TOPIC, {
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
    },
    deselectTask: async(_,{id},{PUBSUB_EVENTS, pubsub}) => {
      try {
        const ca = await CustomerAccount.findByIdAndUpdate(id,{$set: {on_hands: false}},{new: true})
        if(!ca) throw new CustomError("Customer account not found", 404) 
      
        const group = await Group.findById(ca.assigned)
      
        const assigned = ca?.assigned ? (group ? [...group.members] : [ca.assigned]) : []

        await pubsub.publish(PUBSUB_EVENTS.SOMETHING_CHANGED_TOPIC, {
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
    tlEscalation: async(_,{id,tlUserId},{PUBSUB_EVENTS, pubsub}) => {
      try {
        const escalateToTL = await CustomerAccount.findById(id)
        if(!escalateToTL) throw new CustomError('Customer not found', 404)

        const findTl = await User.findById(tlUserId)
        if(!findTl) throw new CustomError('User not found',404)

        await CustomerAccount.updateOne({_id: id},{$set: {assigned: findTl._id, assignedModel: 'User'}})
        
        await pubsub.publish(PUBSUB_EVENTS.SOMETHING_CHANGED_TOPIC, {
          somethingChanged: {
            members: [findTl._id],
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
    },
    updateDatabase: async()=> {
      try {
        
        // const findSelectives = await Disposition.find({selectiveFiles: {$eq: new mongoose.Types.ObjectId("68da0371ee872f3ae955225b")}})

        return {
          success: true,
          message: "Customers Account Successfully update"
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
  },

}

export default taskResolver