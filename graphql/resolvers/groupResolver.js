import mongoose from "mongoose"
import CustomError from "../../middlewares/errors.js"
import Group from "../../models/group.js"
import User from "../../models/user.js"

const groupResolver = {

  Query: {
    findGroup: async(_,args,context) => {
      const {user} = context
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const getAllGroup = await Group.find({department: user.department})
        return getAllGroup
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
  },
  GroupTask: {
    members: async(parent) => {
      try {
        const members = await User.find({_id: {$in:parent.members}})
        return members
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
  Mutation: {
    createGroup: async(_,{name,description}, {user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        await Group.create({name,description, department: user.department})
        return {success: true, message: `Group successfully created`}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    updateGroup: async(_,{id,name, description}, {user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try { 
        await Group.findByIdAndUpdate(id, {$set: {name, description, members: member}})
        return {success: true, message: `Group successfully updated`}
      } catch (error) {
        throw new CustomError(error.message, 500)
      } 
    },
    addGroupMember: async(_,{id,member},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        
      } catch (error) {
        throw new CustomError(error.message, 500) 
      }
      
    }
  }
}

export default groupResolver