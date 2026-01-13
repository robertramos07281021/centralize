import Department from "../../models/department.js";
import CustomError from "../../middlewares/errors.js";
import Branch from "../../models/branch.js";
import User from "../../models/user.js";
import Bucket from "../../models/bucket.js";
import mongoose from "mongoose";
import { safeResolver } from "../../middlewares/safeResolver.js";

const deptResolver = {
  Query: {
    getDepts: safeResolver(async () => {
      const result = await Department.find();
      return result;
    }),
    getDept: safeResolver(async (_, { name }) => {
      const res = await Department.findOne({ name });

      if (!res) throw new CustomError("Department not exists", 404);
      return res;
    }),
    getBranchDept: safeResolver(async (_, { branch }) => {
      if (!branch) return null;

      const findBranch = await Branch.findOne({ name: branch });
      if (!findBranch) throw new CustomError("Branch not exists", 404);
      const res = await Department.find({ branch: findBranch.name });
      return res || [];
    }),
    getAomDept: safeResolver(async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const res = await Department.find({ aom: user._id });
      return res;
    }),
    getDepartmentBucket: safeResolver(async (_, { depts }) => {
      if (!depts) return null;

      const deptsRes = (
        await Department.find({
          _id: { $in: depts.map((d) => new mongoose.Types.ObjectId(d)) },
        })
      ).map((d) => d.name);

      if (deptsRes.length < 1) {
        throw new CustomError("No Campaign selected", 404);
      }
      const buckets = await Bucket.find({ dept: { $in: deptsRes } });

      return buckets;
    }),
  },
  Dept: {
    aom: safeResolver(async (parent) => {
      const aom = await User.findById(parent.aom);
      return aom;
    }),
  },

  Mutation: {
    createDept: safeResolver(async (_, { name, branch, aom }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const [findBranch, findUser, findDept] = await Promise.all([
        await Branch.findOne({ name: branch }).lean(),
        await User.findOne({ name: aom.toLowerCase() }).lean(),
        await Department.findOne({
          $and: [{ name: { $eq: name } }, { branch: { $eq: branch } }],
        }),
      ]);

      if (!findBranch) throw new CustomError("Branch not existing", 400);

      if (!findUser) throw new CustomError("User not found");

      if (findDept) throw new CustomError("Duplicate", 400);

      const typeOfUser = {
        ADMIN: null,
        AOM: findUser._id,
      };

      await Department.create({
        name,
        branch,
        aom: typeOfUser[findUser.type],
      });

      return { success: true, message: "Department successfully created" };
    }),
    updateDept: safeResolver(async (_, { id, name, branch, aom }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const findBranch = await Branch.findOne({ name: branch });
      if (!findBranch) throw new CustomError("Branch not existing", 400);

      const findUser = await User.findOne({ name: aom.toString() });
      if (!findUser) throw new CustomError("User not found");

      const aomDeclared = name === "admin" ? null : findUser._id;

      const updateDept = await Department.findById(id);
      if (!updateDept) throw new CustomError("Department not found", 404);

      await Bucket.updateMany(
        { dept: updateDept.name },
        { $set: { dept: name } }
      );

      updateDept.name = name;
      updateDept.branch = branch;
      updateDept.aom = aomDeclared;
      await updateDept.save();

      return { success: true, message: "Department successfully updated" };
    }),
    deleteDept: safeResolver(async (_, { id }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const deletedDept = await Department.findByIdAndDelete(id);
      if (!deletedDept) throw new CustomError("Department not found", 404);

      const findDept = await Department.find({ name: deletedDept.name });
      if (findDept.length === 0) {
        await Bucket.deleteMany({ dept: { $eq: deletedDept.name } });
      }
      return { success: true, message: "Department successfully deleted" };
    }),
  },
};

export default deptResolver;
