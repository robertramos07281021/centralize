import Department from "../../models/department.js";
import CustomError from "../../middlewares/errors.js";
import Branch from "../../models/branch.js";
import User from "../../models/user.js";
import Bucket from "../../models/bucket.js";

const deptResolver = {
  Query: {
    getDepts: async()=> {
      try {
        const result = await Department.find()
        return result
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    },
    getDept: async(_,{name}) => {
      try {
        const res = await Department.findOne({name})
        if(!res) throw new CustomError("Department not exists",404)
          return res
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getBranchDept: async(_,{branch}) => {
      try {
        const res = await Department.find({branch})
        if(!res.length === 0) throw new CustomError("Branch not exists",404)
        return res.length > 0 ? res : [];
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    // getAomDept: async(_,__,{user}) => {
    //   if(!user) throw new CustomError("Unauthorized",401)
    //   try { 
    //     const res = await Department.find({aom: user._id})
    //     return res
    //   } catch (error) {
    //     throw new CustomError(error.message,500)
    //   }
    // },
  },
  Dept: {
    aom: async(parent) => {
      try {
        const aom = await User.findById(parent.aom)
        return aom
      } catch (error) {
        throw new CustomError(error.message,500)
      }
      
    }
  },

  Mutation: {
    createDept: async(_,{name, branch, aom}, {user} ) => {
      if(!user) throw new CustomError("Unauthorized",401)
   
      try {
          const [findBranch, findUser, findDept] = await Promise.all([
          await Branch.findOne({name:branch}).lean(),
          await User.findOne({name: aom.toLowerCase()}).lean(),
          await Department.findOne({
            $and: [{name: {$eq: name},},{branch: {$eq:branch}}]
          })
        ])

        if(!findBranch) throw new CustomError("Branch not existing",400)
  
        if(!findUser) throw new CustomError("User not found")

        if(findDept) throw new CustomError("Duplicate",400)

        const typeOfUser = {
          ADMIN: null,
          AOM: findUser._id
        }

        await Department.create({name, branch, aom:typeOfUser[findUser.type] }) 

        return {success: true, message: "Department successfully created"}
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    },
    updateDept: async(_,{id,name, branch, aom},{user}) => {
    
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const findBranch = await Branch.findOne({name: branch})
        if(!findBranch) throw new CustomError("Branch not existing",400)
      
        const findUser = await User.findOne({name: aom.toString()})
        if(!findUser) throw new CustomError("User not found")

        const aomDeclared = name === "admin" ? null : findUser._id

        const updateDept = await Department.findById(id)
        if(!updateDept)  throw new CustomError("Department not found",404)

        await Bucket.updateMany({dept: updateDept.name },{$set: {dept: name}})

        updateDept.name = name
        updateDept.branch = branch
        updateDept.aom = aomDeclared
        await updateDept.save()

        return {success: true, message: "Department successfully updated"}
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    },
    deleteDept: async(_,{id}, {user})=> {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const deletedDept = await Department.findByIdAndDelete(id)
        if(!deletedDept) throw new CustomError("Department not found",404)
    
        const findDept = await Department.find({name: deletedDept.name}) 
        if(findDept.length === 0) {
          await Bucket.deleteMany({dept: {$eq: deletedDept.name}})
        }
        return {success: true, message:"Department successfully deleted"}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
  },
}

export default deptResolver