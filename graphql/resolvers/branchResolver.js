import Branch from "../../models/branch.js";
import CustomError from "../../middlewares/errors.js";

const branchResolver = {
  Query: {
    getBranches: async() => {
      try {
        return await Branch.find({}) 
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getBranch: async(_,{name}) => {
      try {
        const res = await Branch.findOne({name}) 
        return res 
      } catch (error) {
        console.log(error)
        throw new CustomError(error.message, 500)
      }
    }
  },
  Mutation: {
    createBranch: async(_,{name},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        await Branch.create({name})
        return {message: "Successfully created branch", success: true}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    updateBranch: async(_,{id, name},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const updateBranch = await Branch.findByIdAndUpdate(id,{$set: { name }})
        if(!updateBranch) throw new CustomError("Branch not found",404)
        return {message: "Branch successfully updated",success: true}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    deleteBranch: async(_,{id}, {user} ) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const deleteBranch = await Branch.findByIdAndDelete(id)
        if(!deleteBranch) throw new CustomError("Branch not found",404)
        return {message: "Branch successfully deleted",success: true}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  }
}

export default branchResolver