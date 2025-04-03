import CustomError from "../../middlewares/errors.js";
import Branch from "../../models/branch.js";
import Department from "../../models/department.js";
import User from "../../models/user.js";
import bcrypt from "bcryptjs";
import "dotenv/config.js"
import jwt from "jsonwebtoken"
import ModifyRecord from "../../models/modifyRecord.js";
import {DateTime} from "../../middlewares/dateTime.js";
import Production from "../../models/production.js";


const userResolvers = {
  DateTime,
  Query: {
    getUsers: async (_,{page = 1}) => {
      try {
        const res = await User.aggregate([
          {
            $facet: {
              users: [
                { $skip: (page - 1) * 20 },
                { $limit: 20 }
              ],
              total: [
                {$count: "totalUser"}
              ]
            }
          }
        ])
        return {
          users: res[0].users ?? [],
          total: res[0].total.length > 0 ? res[0].total[0].totalUser : 0,
        }
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    },
    getUser: async (_, { id })=>
    {

      try {
        return await User.findById(id)
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    },
    getMe: async (_, __, { user }) => {
      if (!user) throw new CustomError("Not authenticated",401);
      return user; 
    },
    getAomUser: async() => {
      try {
        return await User.find({type: "AOM"})
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    findUsers: async(_,{search, page}) => {
      const res = await User.aggregate([
        {
          $match: { 
            $or: [
              {name: {$regex: search, $options: "i"} },
              {username: {$regex: search, $options: "i"}},
              {type: {$regex: search, $options: "i"}},
              {branch: {$regex: search, $options: "i"}},
              {department: {$regex: search, $options: "i"}}
            ]
          }
        },
        {
          $facet: {
            users: [
              { $skip: (page - 1) * 20 },
              { $limit: 20 }
            ],
            total: [{$count: "totalUser"}]
          }
        
        }
      ])

      return {
        users: res[0].users ?? [],
        total: res[0].total.length > 0 ? res[0].total[0].totalUser : 0,
      };
    },
    // getProd: async()=> {
      
    //   return 
    // }
  },
  Mutation: {
    createUser: async (
      _,
      { name, username, branch, department, type}, {user}) => {
      
        try {

          if(!user) throw new CustomError("Unauthorized",401)

          const findBranch = await Branch.findOne({name: branch})
          if(!findBranch) throw new Error("Branch not found")
    
          const findDept = await Department.findOne({name: department})
          if(!findDept) throw new Error("Department not found")
          
          const saltPassword = await bcrypt.genSalt(10)
          const hashPassword = await bcrypt.hash(type === "admin" ? "adminadmin" :"Bernales2025", saltPassword)

          const newUser = new User({ name, username, password:hashPassword , branch, department, type});
          await newUser.save();

          await ModifyRecord.create({name: "Created", user: newUser._id})

          return newUser;
          
        } catch (error) {
          throw new CustomError(error.message,500)
        }
    },

    updatePassword: async (_, { password, confirmPass }, { user }) => {
      try {

        if(!user) throw new CustomError("Unauthorized",401)
        
        if(confirmPass !== password) throw new CustomError("Not Match",401)
          
        const userChangePass = await User.findById(user.id)
        if(!userChangePass) throw new CustomError("User not found",404)

        const saltPassword = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, saltPassword)

        userChangePass.password = hashPassword
        userChangePass.change_password = true

        await userChangePass.save()

        await ModifyRecord.create({name: "Update Password", user: userChangePass._id})

        return userChangePass
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    },

    login: async(_,{ username, password },{ res }) => {
      try {
        const user = await User.findOne({username})
  
        if(!user) throw new CustomError("Invalid",401)
        
        const validatePassword = await bcrypt.compare(password, user.password)
        if(!validatePassword) throw new CustomError("Invalid",401)
  
        const token = jwt.sign({id: user._id,username: user.username}, process.env.SECRET,
          // { expiresIn: "1d"}
        )
  
        user.isOnline = true
        await user.save()

        if(user.type === "AGENT") {
          const findProd = await Production.find({user: user._id}).sort({"createdAt": -1})
          if (findProd.length > 0) {
            const newDateFindProd = new Date(findProd[0].createdAt);
            const newDateToDay = new Date();
          
            // Remove time (set hours, minutes, seconds to 0)
            newDateFindProd.setHours(0, 0, 0, 0);
            newDateToDay.setHours(0, 0, 0, 0);
          
            if (newDateFindProd.getTime() !== newDateToDay.getTime()) {
              await Production.create({
                user: user._id,
              });
            }
          } else {
            // If no previous production exists, create a new one
            await Production.create({
              user: user._id,
            });
          }
        }
        
        res.cookie("token",token, { httpOnly: true,
        })

        return {success: true, message: "Logged in", user: user}
        
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    },
    logout: async(_,__,{ user, res }) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)

        await User.findByIdAndUpdate(user._id, {isOnline: false})
        
        res.clearCookie("token",{
          httpOnly: true
        })
        

        return { success: true, message: "Successfully logout"}
      } catch (error) {
        throw new CustomError(error.message,500)
      }
    },
    resetPassword: async(_,{id}, {user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {

        const saltPassword = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash("Bernales2025", saltPassword)
        const user = await User.findByIdAndUpdate(id,{$set: {password: hashPassword, change_password: false}})
        if(!user) throw new CustomError("User not found",404)
         
        await ModifyRecord.create({name: "Reset Password", user: user._id})  

        return {success: true, message: "User password updated"}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    updateUser: async(_,{id, name, type, branch, department, bucket },{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const updateUser = await User.findByIdAndUpdate(id,{name, type, branch, department, bucket},{new: true})
        if(!updateUser) throw new CustomError("User not found",404)
        
        await ModifyRecord.create({name: "Update User Info", user: updateUser._id})
        
        return {success: true , message: "User account successfully updated", user: updateUser }

      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    } ,
    updateActiveStatus: async(_,{id},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const findUser = await User.findById(id)
        if(!findUser) throw CustomError("User not found",404)
        findUser.active = !findUser.active
        await ModifyRecord.create({name: `${findUser.active ? "Activation": "Deactivation"}`, user: findUser._id})
        await findUser.save()
        return {
          success: true, message: "User status successfully updated", user: findUser
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
};

export default userResolvers;




