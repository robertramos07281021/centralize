import mongoose from "mongoose"
import CustomError from "../../middlewares/errors.js"
import Bucket from "../../models/bucket.js"
import Customer from "../../models/customer.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"
import DispoType from "../../models/dispoType.js"
import Group from "../../models/group.js"
import User from "../../models/user.js"

const taskResolver = {
  Query: {
    myTasks: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const myTask = await CustomerAccount.aggregate([
        {
          $match:
          {$and : [{assigned: user._id},{ on_hands: false}]}
        }, 
        {
          $lookup: {
            from: "dispositions", 
            localField: "history", 
            foreignField: "_id",       
            as: "dispo_history"         
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

        const customerAccounts = await CustomerAccount.aggregate(
          {
            $match: {
              $and: [{assigned: myGroup._id},{on_hands: false}]
            }
          },
          {
            $lookup: {
              from: "dispositions", 
              localField: "history", 
              foreignField: "_id",       
              as: "dispo_history"         
            }
          }
        )

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
    selectTask: async(_,{id}, {user, pubsub, PUBSUB_EVENTS})=>{
      if(!user) throw new CustomError("Unauthorized",401)
      try {
    
        const ca = await CustomerAccount.findById(id)
        if(!ca) throw new CustomError("Customer account not found", 404) 
      
        const findGroup = await Group.findById(ca.assigned)
 
        const assigned = ca.assigned ? (findGroup ? findGroup.members : [user._id]) : []

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

        await CustomerAccount.updateOne({_id: id},{$set: {assigned: findTl._id}})
        
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
        const findCustomerAccounts = await CustomerAccount.find()

        await Promise.all(
          findCustomerAccounts.map((async(e)=> {
            await Customer.findByIdAndUpdate(e.customer,{$set: {customer_account: e._id}}) 
          }))
        )

        // await Promise.all(
        //   findCustomerAccounts.map(async(e, index)=> {
        //     const dispositions = await Disposition.find({customer_account: {$eq: new mongoose.Types.ObjectId(e._id)}})
        //     if(index === 1) {
        //       console.log(dispositions)
        //     }
        //     const dispositionIds = dispositions.map(x => x._id);
        //     await CustomerAccount.findByIdAndUpdate(e._id, {$set: {history: dispositionIds } })
        //   })
        // )



        // const RPCDispo = ['UNEG','FFUP','ITP','PAID','PTP','DEC','RTP']

        // const allDispotype = await DispoType.aggregate([
        //   {
        //     $match: {
        //       code: {$in: RPCDispo}
        //     }
        //   },
        //   {
        //     $group: {
        //       _id: 0,
        //       ids: {
        //         $push: "$_id"
        //       }
        //     }
        //   },
        //   {
        //     $project: {
        //       _id: 0,
        //       ids: 1
        //     }
        //   }
        // ])

        
        
        // const findCustomersAccount = await CustomerAccount.aggregate([
        //   {
        //     $match: {
        //       history:  {$size: 0}
        //     }
        //   },
        // ])
        // console.log(findCustomersAccount.length)
        
        // const findCustomersAccount = await CustomerAccount.aggregate([
        //   {
        //     $match: {
        //       history: {$not: {$size: 0}}
        //     }
        //   },
        //   {
        //     $lookup: {
        //       from: "dispositions", 
        //       localField: "history", 
        //       foreignField: "_id",       
        //       as: "dispo_history"         
        //     }
        //   },
        //   {
        //     $match: {
        //       "dispo_history.disposition": { $in: allDispotype[0]?.ids.map(x=> new mongoose.Types.ObjectId(x)) || [] }
        //     }
        //   }
        // ])
     
        // await Promise.all(
        //   findCustomersAccount.map(async(e)=> {
        //     const res = await Customer.findByIdAndUpdate(e.customer, {$set: {isRPC: true}})
           
        //   })
        // )

        // const RPCDisponew = allDispotype[0]?.ids.map(y=> y.toString()) ?? [];
        
        
        // await Promise.all(
        //   findCustomersAccount.map(async(e)=> {
        //     await CustomerAccount.findByIdAndUpdate(e._id,{$set: {history: []}} )
        //   })
        // )

        // const findCustomer = await Customer.find({
        //   contact_no: { $elemMatch: { $regex: /^00/ } }
        // })

        // await Promise.all(
        //   findCustomer.map(async (account) => {
        //     const updatedContacts = account.contact_no.map((num) => {
        //       return num.startsWith("00") ? num.replace(/^00/, "0") : num;
        //     });

        //     await Customer.findByIdAndUpdate(account._id, {
        //       $set: { contact_no: updatedContacts }
        //     });
        //   })
        // )




        return {
          success: true,
          message: "Customers Account Successfully update"
        }
      } catch (error) {
        console.log(error)
        throw new CustomError(error.message, 500)
      }
    }
  },

}

export default taskResolver