import CustomError from "../../middlewares/errors.js";
import Branch from "../../models/branch.js";
import Department from "../../models/department.js";
import User from "../../models/user.js";
import bcrypt from "bcryptjs";
import "dotenv/config.js";
import jwt from "jsonwebtoken";
import ModifyRecord from "../../models/modifyRecord.js";
import { DateTime } from "../../middlewares/dateTime.js";
import Production from "../../models/production.js";
import Bucket from "../../models/bucket.js";
import mongoose from "mongoose";
import { logoutVici } from "../../middlewares/vicidial.js";
import CustomerAccount from "../../models/customerAccount.js";

const userResolvers = {
  DateTime,
  Query: {
    getBucketUser: async (_, { bucketId }, { user }) => {
      try {
        let filter = null;
        if (bucketId) {
          filter = bucketId;
        } else {
          filter = { $in: user.buckets };
        }
        const findUser = await User.find({
          type: { $eq: "AGENT" },
          buckets: filter,
        });
        return findUser;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getUsers: async (_, { page = 1, limit = 20 }) => {
      try {
        const res = await User.aggregate([
          {
            $facet: {
              users: [{ $skip: (page - 1) * limit }, { $limit: limit }],
              total: [{ $count: "totalUser" }],
            },
          },
        ]);
        return {
          users: res[0].users ?? [],
          total: res[0].total.length > 0 ? res[0].total[0].totalUser : 0,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getUser: async (_, { id }) => {
      try {
        return await User.findById(id);
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getMe: async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      return user;
    },
    getAomUser: async () => {
      try {
        return await User.find({ type: "AOM" });
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    findUsers: async (_, { search, page, limit, filter }) => {
      try {
        function escapeRegex(str) {
          return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
        const searchFilter = { $regex: escapeRegex(search), $options: "i" };
        const res = await User.aggregate([
          {
            $lookup: {
              from: "departments",
              localField: "departments",
              foreignField: "_id",
              as: "department",
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "buckets",
              foreignField: "_id",
              as: "bucket",
            },
          },
          {
            $lookup: {
              from: "branches",
              localField: "branch",
              foreignField: "_id",
              as: "user_branch",
            },
          },
          {
            $unwind: { path: "$user_branch", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              ...(filter === "online" ? { isOnline: true } : []),
              ...(filter === "offline" ? { isOnline: false } : []),
              $or: [
                { name: searchFilter },
                { username: searchFilter },
                { type: searchFilter },
                { "user_branch.name": searchFilter },
                { department: { $elemMatch: { name: searchFilter } } },
                { bucket: { $elemMatch: { name: searchFilter } } },
                { user_id: searchFilter },
                ...(search.toLowerCase() === "active"
                  ? [{ active: true }]
                  : []),
                ...(search.toLowerCase() === "inactive"
                  ? [{ active: false }]
                  : []),
                ...(search.toLowerCase() === "islock"
                  ? [{ isLock: true }]
                  : []),
                ...(search.toLowerCase() === "unlock"
                  ? [{ isLock: false }]
                  : []),
              ],
            },
          },
          {
            $facet: {
              users: [{ $skip: (page - 1) * limit }, { $limit: limit }],
              total: [{ $count: "totalUser" }],
            },
          },
        ]);
        const users = res[0]?.users || [];
        const total = res[0]?.total[0]?.totalUser || 0;

        return {
          users: users,
          total: total,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getQAUsers: async (_, { page, limit }) => {
      try {
        const skip = (page - 1) * limit;

        const qaUsers = await User.aggregate([
          { $match: { type: "QA" } },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              users: [{ $skip: skip }, { $limit: limit }],
              total: [{ $count: "user" }],
            },
          },
        ]);

        const users = qaUsers[0]?.users || [];
        const total = qaUsers[0]?.total?.[0]?.user || 0;

        return { users, total };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },

    getAgentsByDepartment: async (_, { deptId }) => {
      try {
        if (!deptId) {
          return [];
        }

        const department = await Department.findById(deptId);
        if (!department) {
          return [];
        }

        const agents = await User.find({
          type: { $eq: "AGENT" },
          departments: { $in: [department._id] },
          active: true,
        }).select("_id name");

        return agents;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    findDeptAgents: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Not authenticated", 401);



        const agentWithHandleCustomer = await User.aggregate([
          {
            $match: {
              $and: [
                { buckets: { $in: user.buckets } },
                { type: { $eq: "AGENT" } },
              ],
            },
          },
          {
            $lookup: {
              from: "customeraccounts",
              localField: "handsOn",
              foreignField: "_id",
              as: "ca",
            },
          },
          {
            $unwind: { path: "$ca", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "customers",
              localField: "ca.customer",
              foreignField: "_id",
              as: "customer",
            },
          },
          {
            $unwind: { path: "$customer", preserveNullAndEmptyArrays: true },
          },
 
        ]);
        return agentWithHandleCustomer;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    findAgents: async (_, __, { user }) => {
      if (!user) throw new CustomError("Not authenticated", 401);
      try {
        const agents = await User.find({
          departments: { $in: user.departments },
          active: true,
        });
        return agents;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getCampaignAssigned: async (_, { bucket }) => {
      try {
        if (!bucket) return null;
        const assigned = await User.countDocuments({
          type: "AGENT",
          reliver: false,
          active: true,
          buckets: new mongoose.Types.ObjectId(bucket),
        });

        return assigned;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getAOMCampaignFTE: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Not authenticated", 401);

        const aomFTEs = await User.aggregate([
          {
            $match: {
              type: "AGENT",
              $expr: {
                $eq: [{ $size: "$departments" }, 1],
              },
            },
          },
          {
            $lookup: {
              from: "departments",
              localField: "departments",
              foreignField: "_id",
              as: "department",
            },
          },
          {
            $unwind: { path: "$department", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "department.aom": new mongoose.Types.ObjectId(user._id),
            },
          },
          {
            $group: {
              _id: {
                _id: "$department._id",
                name: "$department.name",
                branch: "$department.branch",
              },
              users: {
                $push: {
                  isOnline: "$isOnline",
                  user_id: "$user_id",
                  name: "$name",
                  buckets: "$buckets",
                },
              },
            },
          },
          {
            $sort: { "_id.name": 1 },
          },
          {
            $project: {
              _id: 0,
              department: "$_id",
              users: 1,
            },
          },
        ]);

        return aomFTEs;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getHelperAgent: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Not authenticated", 401);

        const userId = new mongoose.Types.ObjectId(user._id);

        const UserHelper = await User.aggregate([
          {
            $lookup: {
              from: "departments",
              localField: "departments",
              foreignField: "_id",
              as: "department",
            },
          },
          {
            $addFields: {
              filteredDepartments: {
                $filter: {
                  input: "$department",
                  as: "dep",
                  cond: {
                    $eq: ["$$dep.aom", userId],
                  },
                },
              },
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $gt: [{ $size: "$filteredDepartments" }, 0],
                  },
                  {
                    $gt: [{ $size: "$departments" }, 1],
                  },
                ],
              },
              type: "AGENT",
            },
          },
        ]);

        return UserHelper;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getBucketTL: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Not authenticated", 401);
        const findUserTLs = await User.aggregate([
          {
            $match: {
              buckets: {
                $in: user.buckets.map((e) => new mongoose.Types.ObjectId(e)),
              },
              type: "TL",
            },
          },
        ]);
        return findUserTLs;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getBucketTLByBucket: async (_, { bucketId }) => {
      try {
        if (!bucketId) {
          return [];
        }

        const bucketObjectId = new mongoose.Types.ObjectId(bucketId);

        const tls = await User.find({
          type: { $eq: "TL" },
          buckets: { $in: [bucketObjectId] },
          active: true,
        }).select("_id name buckets");

        return tls;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  DeptUser: {
    buckets: async (parent) => {
      try {
        const buckets = await Bucket.find({ _id: { $in: parent.buckets } });
        return buckets;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    departments: async (parent) => {
      try {
        const departments = await Department.find({
          _id: { $in: parent.departments },
        });

        return departments;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  Mutation: {
    createUser: async (_, { createInput }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const {
          name,
          username,
          branch,
          departments,
          type,
          user_id,
          buckets,
          account_type,
          callfile_id,
          vici_id,
          softphone,
        } = createInput;

        if (type === "AGENT") {
          await Promise.all(
            departments.map(async (deptId) => {
              const found = await Department.findById(deptId);
              if (!found) throw new Error(`Department not found: ${deptId}`);
            })
          );

          await Promise.all(
            buckets.map(async (bucketId) => {
              const found = await Bucket.findById(bucketId);
              if (!found) throw new Error(`Bucket not found: ${bucketId}`);
            })
          );

          const findBranch = await Branch.findById(branch);
          if (!findBranch) throw new Error("Branch not found");
        }

        const saltPassword = await bcrypt.genSalt(10);
        const password =
          type.toLowerCase() === "admin" ? "adminadmin" : "Bernales2025";

        const hashPassword = await bcrypt.hash(password, saltPassword);

        const newUser = new User({
          name,
          username,
          password: hashPassword,
          branch: branch || null,
          departments,
          type,
          callfile_id,
          user_id,
          account_type,
          buckets,
          vici_id,
          softphone,
        });

        await newUser.save();

        await ModifyRecord.create({ name: "Created", user: newUser._id });

        return {
          success: true,
          message: "New Account Created",
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },

    updatePassword: async (_, { _id, password, confirmPass }) => {
      try {
        if (!_id) throw new CustomError("Unauthorized", 401);

        if (confirmPass !== password) throw new CustomError("Not Match", 401);

        const userChangePass = await User.findById(_id);

        if (!userChangePass) throw new CustomError("User not found", 404);

        const saltPassword = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, saltPassword);

        userChangePass.password = hashPassword;
        userChangePass.change_password = true;

        await userChangePass.save();

        await ModifyRecord.create({
          name: "Update Password",
          user: userChangePass._id,
        });

        return userChangePass;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    login: async (
      _,
      { username, password },
      { res, req, pubsub, PUBSUB_EVENTS }
    ) => {
      try {
        const user = await User.findOne({ username });

        if (!user) throw new CustomError("Invalid", 401);

        if (user.isLock) throw new CustomError("Lock", 401);

        const validatePassword = await bcrypt.compare(password, user.password);

        if (!validatePassword) {
          if (user.type === "AGENT" && !user.isOnline) {
            user.attempt_login++;
            if (user.attempt_login >= 2) {
              user.isLock = true;
              await pubsub.publish(PUBSUB_EVENTS.SOMETHING_ON_AGENT_ACCOUNT, {
                somethingOnAgentAccount: {
                  buckets: user.buckets,
                  message: PUBSUB_EVENTS.SOMETHING_ON_AGENT_ACCOUNT,
                },
              });
            }
            await user.save();
          }
          throw new CustomError("Invalid", 401);
        }

        req.session.user = user;

        const token = jwt.sign(
          { id: user._id, username: user.username },
          process.env.SECRET
        );

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [findProd, firstProd] = await Promise.all([
          Production.findOne({
            user: user._id,
            createdAt: { $gte: todayStart, $lt: todayEnd },
          }),
          Production.find({ user: new mongoose.Types.ObjectId(user._id) }).sort(
            { createdAt: 1 }
          ),
        ]);

        if (!findProd && user.type === "AGENT") {
          const today_prod =
            firstProd.length > 0
              ? firstProd[0]?.target_today + user.default_target
              : user.default_target;
          await Production.create({
            user: user._id,
            target_today: today_prod,
          });
        }

        let type = null;

        const dateToday = new Date();

        if (user?.type === "AGENT") {
          if (!findProd || findProd?.prod_history?.length <= 0) {
            type = "WELCOME";
          } else {
            type = "PROD";
            const existingProd = findProd?.prod_history?.find(
              (e) => e.existing === true
            );
            if (existingProd?.type === "LOGOUT") {
              findProd?.prod_history.forEach((x) => {
                if (x.existing) {
                  x.end = dateToday;
                  x.existing = false;
                }
              });
              findProd?.prod_history?.push({
                type: "PROD",
                existing: true,
                start: dateToday,
              });
              await findProd.save();
            }
          }
          user.attempt_login = 0;
        }
        user.features.token = token;
        user.isOnline = true;

        await user.save();

        await pubsub.publish(PUBSUB_EVENTS.NEW_LOGIN, {
          newUserLogin: {
            agentId: user?._id,
            message: PUBSUB_EVENTS.NEW_LOGIN,
          },
        });

        return {
          user: user,
          prodStatus: type,
          start: dateToday,
          token,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    logout: async (_, __, { user, res }) => {
      try {
        if (!user) throw new CustomError("Logout: Unauthorized", 401);

        if (user.handsOn) {
          await CustomerAccount.findByIdAndUpdate(user.handsOn, {
            $set: { on_hands: false },
          });
        }

        const findUser = await User.findByIdAndUpdate(
          user._id,
          {
            $set: { isOnline: false },
            $unset: { handsOn: "", "features.token": "" },
          },
          { new: true }
        ).populate("buckets");

        if (!findUser) {
          throw CustomError("User not found", 404);
        }

        if (findUser.type === "AGENT") {
          const start = new Date();
          start.setHours(0, 0, 0, 0);

          const end = new Date();
          end.setHours(23, 59, 59, 999);

          const userProd = await Production.findOne({
            user: findUser._id,
            createdAt: { $gt: start, $lte: end },
          });

          if (userProd?.prod_history.length > 0) {
            const dateToday = new Date();

            userProd.prod_history.forEach((x) => {
              if (x.existing === true) {
                x.existing = false;
                x.end = dateToday;
              }
            });

            userProd.prod_history.push({
              type: "LOGOUT",
              start: dateToday,
              existing: true,
            });

            await userProd.save();
          }
        }

        res.clearCookie("connect.sid");

        const bucket =
          findUser?.buckets?.length > 0
            ? new Array(...new Set(findUser?.buckets?.map((x) => x.viciIp)))
            : [];

        const canCall =
          findUser?.buckets?.length > 0
            ? findUser?.buckets.map((x) => x.canCall)
            : [];

        if (canCall.some((x) => x === true)) {
          await logoutVici(findUser.vici_id, bucket[0]);
        }

        return { success: true, message: "Successfully logout" };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    resetPassword: async (_, { id }) => {
      try {
        const saltPassword = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash("Bernales2026", saltPassword);
        const user = await User.findByIdAndUpdate(
          id,
          {
            $set: {
              password: hashPassword,
              change_password: false,
              isOnline: false,
              new_account: false,
            },
          },
          { new: true }
        );
        if (!user) throw new CustomError("User not found", 404);

        await ModifyRecord.create({ name: "Reset Password", user: user._id });

        return {
          success: true,
          message: "User password updated",
          user: user,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    updateUser: async (_, { updateInput }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      try {
        const { id, ...others } = updateInput;
        const findUser = await User.findById(id);
        if (!findUser) throw new CustomError("User not found", 404);

        if (!findUser.buckets.includes(others.buckets) && !findUser.reliver) {
          await User.findByIdAndUpdate(id, {
            $set: {
              targets: {
                daily_target: 0,
                weekly_target: 0,
                monthly_target: 0,
                daily_variance: 0,
                weekly_variance: 0,
                montlhy_variance: 0,
              },
            },
          });
        }

        const updateUser = await User.findByIdAndUpdate(
          id,
          { $set: { ...others } },
          { new: true }
        );

        await ModifyRecord.create({
          name: "Update User Info",
          user: updateUser._id,
        });

        return {
          success: true,
          message: "User account successfully updated",
          user: updateUser,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    updateActiveStatus: async (_, { id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const findUser = await User.findById(id);
        if (!findUser) throw CustomError("User not found", 404);
        findUser.active = !findUser.active;
        await ModifyRecord.create({
          name: `${findUser.active ? "Activation" : "Deactivation"}`,
          user: findUser._id,
        });
        await findUser.save();
        return {
          success: true,
          message: "User status successfully updated",
          user: findUser,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    logoutToPersist: async (_, { id }, { res }) => {
      try {
        const findUser = await User.findByIdAndUpdate(
          id,
          {
            $set: { isOnline: false },
            $unset: { "features.token": "" },
          },
          { new: true }
        );

        if (!findUser) {
          throw CustomError("User not found", 404);
        }

        if (findUser.type === "AGENT") {
          const start = new Date();
          start.setHours(0, 0, 0, 0);

          const end = new Date();
          end.setHours(23, 59, 59, 999);

          const userProd = await Production.findOne({
            user: findUser._id,
            createdAt: { $gt: start, $lte: end },
          });

          if (userProd?.prod_history?.length > 0) {
            const dateToday = new Date();

            userProd.prod_history.forEach((x) => {
              if (x.existing === true) {
                x.existing = false;
                x.end = dateToday;
              }
            });

            userProd.prod_history.push({
              type: "LOGOUT",
              start: dateToday,
              existing: true,
            });

            await userProd.save();
          }
        }

        res.clearCookie("connect.sid");

        return {
          success: true,
          message: "Successfully logout",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    unlockUser: async (_, { id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const unlockUser = await User.findByIdAndUpdate(
          id,
          {
            $set: {
              isLock: false,
              attempt_login: 0,
            },
          },
          { new: true }
        );

        if (!unlockUser) throw new CustomError("Agent not found", 404);

        await ModifyRecord.create({
          name: "Unlock account",
          user: unlockUser._id,
        });

        return {
          success: true,
          message: `Successfully unlock ${unlockUser.name.toUpperCase()} account`,
          user: unlockUser,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    adminLogout: async (_, { id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const logoutUser = await User.findByIdAndUpdate(
          id,
          { $set: { isOnline: false } },
          { new: true }
        );

        const userBuckets = await Bucket.find({
          _id: {
            $in: logoutUser.buckets.map((x) => new mongoose.Types.ObjectId(x)),
          },
        });

        if (!logoutUser) throw new CustomError("User not found", 404);

        if (logoutUser.type === "AGENT") {
          const start = new Date();
          start.setHours(0, 0, 0, 0);

          const end = new Date();
          end.setHours(23, 59, 59, 999);

          const userProd = await Production.findOne({
            user: logoutUser._id,
            createdAt: { $gt: start, $lte: end },
          });

          if (userProd.prod_history.length > 0) {
            const dateToday = new Date();

            userProd?.prod_history?.forEach((x) => {
              if (x.existing === true) {
                x.existing = false;
                x.end = dateToday;
              }
            });

            userProd.prod_history.push({
              type: "LOGOUT",
              start: dateToday,
              existing: true,
            });

            await userProd.save();
          }
        }

        const bucket =
          userBuckets > 0
            ? new Array(...new Set(userBuckets.map((x) => x.viciIp)))
            : [];

        const userBucketsCanCall = userBuckets
          .map((x) => x.canCall)
          .some((y) => y === true);
        if (userBucketsCanCall) {
          await logoutVici(logoutUser.vici_id, bucket[0]);
        }

        await ModifyRecord.create({ name: "Logout", user: logoutUser._id });
        return {
          success: true,
          message: "Successfully logout",
          user: logoutUser,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    authorization: async (_, { password }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const validatePassword = await bcrypt.compare(password, user.password);

        if (!validatePassword) throw new CustomError("Invalid");

        return {
          success: true,
          message: "Password is valid",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    deleteUser: async (_, { id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) throw new CustomError("User not found", 400);

        return {
          success: true,
          message: "User successfully deleted",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    updateUserVici_id: async (_, { vici_id }, { user }) => {
      try {
        const updateUser = await User.findByIdAndUpdate(
          user._id,
          {
            $set: {
              vici_id: vici_id,
            },
          },
          { new: true }
        );

        if (!updateUser) throw new CustomError("User not found", 401);

        return {
          success: true,
          message: "Successfully added vici dial id",
          user: updateUser,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    updateQAUser: async (_, { input }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const { userId, departments, buckets, scoreCardType } = input;

        const updateFields = {};
        if (typeof departments !== "undefined") {
          updateFields.departments = departments;
        }
        if (typeof buckets !== "undefined") {
          updateFields.buckets = buckets;
        }
        if (typeof scoreCardType !== "undefined") {
          updateFields.scoreCardType = scoreCardType;
        }

        if (Object.keys(updateFields).length === 0) {
          throw new CustomError("No fields provided", 400);
        }

        const updatedUser = await User.findByIdAndUpdate(userId, {
          $set: updateFields,
        });

        if (!updatedUser) throw new CustomError("User not found", 401);

        return {
          success: true,
          message: "User successfully updated",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default userResolvers;
