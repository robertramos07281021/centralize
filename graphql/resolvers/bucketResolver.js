import CustomError from "../../middlewares/errors.js";
import Bucket from "../../models/bucket.js";
import Department from "../../models/department.js";

const bucketResolver = {
  Query: {
    getBuckets: async(_,{dept}) => {
      try {
        return await Bucket.find({dept}) 
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getBucket: async(_,{name}) => {
      try {
        const res = await Bucket.findOne({name}) 
        return res 
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getDeptBucket: async(_,__,{user}) => {
      try {
        const res = await Bucket.find({dept: user.department})
        return res
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    findDeptBucket: async(_,{dept},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const findDept = await Department.findById(dept)
        if(!findDept) throw new CustomError("Department not found", 404)
        const res = await Bucket.find({dept: findDept.name})
        return res
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
  Mutation: {
    createBucket: async(_,{name,dept},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {

        const checkDept = await Department.findOne({name: dept})
        if(!checkDept) throw new CustomError("Department not found",404)
          
        const checkName = await Bucket.findOne({$and: [
          {name},
          {dept}
        ]})
        if(checkName) throw new CustomError("Duplicate",400)
    
        await Bucket.create({name, dept})
        return {message: "Bucket successfully created", success: true}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    updateBucket: async(_,{id, name},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const updateBucket = await Bucket.findById(id,)
        if(!updateBucket) throw new CustomError("Bucket not found",404)

        const checkBucket = await Bucket.findOne({$and: [{name},{dept: updateBucket.dept}]})
        if(checkBucket) throw new CustomError("Duplicate", 400) 

        await updateBucket.updateOne({$set: { name }})
        return {message: "Bucket successfully updated",success: true}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    deleteBucket: async(_,{id}, {user} ) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const deleteBucket = await Bucket.findByIdAndDelete(id)
        if(!deleteBucket) throw new CustomError("Bucket not found",404)
        return {message: "Bucket successfully deleted",success: true}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  }
}

export default bucketResolver