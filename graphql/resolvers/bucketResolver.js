import CustomError from "../../middlewares/errors.js";
import Bucket from "../../models/bucket.js";
import Department from "../../models/department.js";
import Group from "../../models/group.js";

const bucketResolver = {
  Query: {
    getBuckets: async(_,{dept}) => {
      try {
        const depts = (await Department.find({_id: {$in: dept}})).map((e)=> e.name)
        const deptBucket = await Bucket.aggregate([
          {
            $match: {
              dept: {$in: depts}
            }
          },
          {
            $group: {
              _id: "$dept",
              buckets: {
                $push: {
                  id: "$_id",
                  name: "$name",
                  dept: "$dept"
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              dept: "$_id",
              buckets: 1
            }
          }
        ]) 
        return deptBucket ? deptBucket : []
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getBucket: async(_,{name}) => {
      try {
        return await Bucket.findOne({name})  
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getDeptBucket: async(_,__,{user}) => {
      try {
        const dept = (await Department.find({_id: {$in:user.departments}})).map(e => e.name)
        return await Bucket.find({dept: {$in: dept}})
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
    },
    getAllBucket: async() => {
      try {
        return await Bucket.find()
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getTLBucket: async(_,__,{user}) => {
      try {
        const res = await Bucket.find({_id: user.buckets})
        return res
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    findAomBucket: async(_,__,{user})=> {
      try {
        const aomDept = (await Department.find({aom: user._id}).lean()).map(e => e.name)

        const findAomBucket = await Bucket.aggregate([
          {
            $match: {
              dept: {$in:aomDept}
            }
          },
          {
            $group: {
              _id: "$dept",
              buckets: {
                $push: {
                  id: "$_id",
                  name: "$name"
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              dept: "$_id",
              buckets: 1
            }
          },
          {
            $sort: {
              dept: 1
            }
          }
        ])

        return findAomBucket
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