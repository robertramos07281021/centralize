import Department from "../../models/department.js";
import CustomError from "../../middlewares/errors.js";
import Branch from "../../models/branch.js";
import User from "../../models/user.js";
import Bucket from "../../models/bucket.js";

const deptResolver = {
  Query: {
    getDepts: async()=> {
      try {
    
        const result = await Department.aggregate([
          {
            $lookup: {
              from: "users",       
              localField: "aom",   
              foreignField: "_id", 
              as: "aomData"    
            }
          },
          {
            $unwind: { path: "$aomData", preserveNullAndEmptyArrays: true } 
          }
        ]);
        return result.map(dept => ({
          id: dept._id.toString(),
          name: dept.name,
          branch: dept.branch,
          aom: dept.aomData || null,
          bucket: dept.bucket || []
        }));
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
        return res.length > 0 ? res : []; // ✅ Always return an array
      } catch (error) {
   
        throw new CustomError(error.message, 500)
      }
    }
  },
  Mutation: {
    createDept: async(_,{name, branch, aom}, {user} ) => {
      if(!user) throw new CustomError("Unauthorized",401)
   
      try {
        const findBranch = await Branch.findOne({name:branch})
        if(!findBranch) throw new CustomError("Branch not existing",400)

        const findUser = await User.findOne({name: aom.toLowerCase()})
        if(!findUser) throw new CustomError("User not found")
        const findDept = await Department.findOne({
          $and: [{
            name: {$eq: name},
          },{
            branch: {$eq:branch}
          }
          ]
        })
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

        const updateDept = await Department.findByIdAndUpdate(id,{$set: { name, branch , aom:aomDeclared}})
        if(!updateDept)  throw new CustomError("Department not found",404)

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
  }
}

export default deptResolver