import mongoose from "mongoose";
import CustomError from "../../middlewares/errors.js";
import Bucket from "../../models/bucket.js";
import Department from "../../models/department.js";
import { safeResolver } from "../../middlewares/safeResolver.js";

const bucketResolver = {
  Query: {
    getBuckets: safeResolver(async (_, { dept }) => {
      const depts = (await Department.find({ _id: { $in: dept } })).map(
        (e) => e.name
      );
      const deptBucket = await Bucket.aggregate([
        {
          $match: {
            dept: { $in: depts },
          },
        },
        {
          $group: {
            _id: "$dept",
            buckets: {
              $push: {
                _id: "$_id",
                name: "$name",
                dept: "$dept",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            dept: "$_id",
            buckets: 1,
          },
        },
      ]);
      return deptBucket ? deptBucket : [];
    }),
    getBucket: safeResolver(async (_, { name }) => {
      return await Bucket.findOne({ name });
    }),
    getDeptBucket: safeResolver(async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      const dept = (
        await Department.find({ _id: { $in: user.departments } })
      ).map((e) => e.name);
      return await Bucket.find({ dept: { $in: dept } });
    }),
    findDeptBucket: safeResolver(async (_, { dept }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      if (!dept) return null;
      const findDept = await Department.findById(dept);
      if (!findDept) throw new CustomError("Department not found", 404);
      const res = await Bucket.find({ dept: findDept.name });
      return res;
    }),
    getAllBucket: safeResolver(async () => {
      return await Bucket.find();
    }),
    getTLBucket: safeResolver(async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      const res = await Bucket.find({
        _id: user?.buckets.map((x) => new mongoose.Types.ObjectId(x)),
      });
      return res;
    }),
    findAomBucket: safeResolver(async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      const aomDept = (await Department.find({ aom: user._id }).lean()).map(
        (e) => e.name
      );

      const findAomBucket = await Bucket.aggregate([
        {
          $match: {
            dept: { $in: aomDept },
          },
        },
        {
          $group: {
            _id: "$dept",
            buckets: {
              $push: {
                _id: "$_id",
                name: "$name",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            dept: "$_id",
            buckets: 1,
          },
        },
        {
          $sort: {
            dept: 1,
          },
        },
      ]);
      return findAomBucket;
    }),
    selectedBucket: safeResolver(async (_, { id }) => {
      const findBucket = await Bucket.findById(id);
      return findBucket;
    }),
  },
  Mutation: {
    createBucket: safeResolver(async (_, { input }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      if (!input.viciIp && !input.issabelIp)
        throw new CustomError("Missing Ip addresses", 404);

      const checkDept = await Department.findOne({ name: input.dept });
      if (!checkDept) throw new CustomError("Department not found", 404);

      const checkName = await Bucket.findOne({
        name: input.name,
        dept: input.dept,
      });

      if (checkName) throw new CustomError("Duplicate", 400);

      await Bucket.create({ ...input });
      return { message: "Bucket successfully created", success: true };
    }),
    updateBucket: safeResolver(
      async (_, { input }, { user, pubsub, PUBSUB_EVENTS }) => {
        if (!user) throw new CustomError("Unauthorized", 401);

        const { viciIp, issabelIp, _id, name, ...others } = input;
        if (!viciIp && !issabelIp)
          throw new CustomError("Missing Ip addresses", 404);

        const updateBucket = await Bucket.findById(_id);
        if (!updateBucket) throw new CustomError("Bucket not found", 404);

        const checkBucket = await Bucket.find({
          name,
          dept: updateBucket.dept,
          _id: { $ne: updateBucket._id },
        });
        if (checkBucket.length > 0) throw new CustomError("Duplicate", 400);

        await Bucket.findByIdAndUpdate(
          updateBucket._id,
          { $set: { name, viciIp, issabelIp, ...others } },
          { new: true }
        );

        await pubsub.publish(PUBSUB_EVENTS.NEW_UPDATE_BUCKET, {
          newUpdateOnBucket: {
            bucket: updateBucket._id,
            message: PUBSUB_EVENTS.NEW_UPDATE_BUCKET,
          },
        });

        return { message: "Bucket successfully updated", success: true };
      }
    ),
    deleteBucket: safeResolver(async (_, { id }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const deleteBucket = await Bucket.findByIdAndDelete(id);
      if (!deleteBucket) throw new CustomError("Bucket not found", 404);
      return { message: "Bucket successfully deleted", success: true };
    }),
    messageBucket: safeResolver(
      async (_, { id, message }, { pubsub, PUBSUB_EVENTS }) => {
        const findBucket = await Bucket.findByIdAndUpdate(id, {
          $set: { message: message },
        });

        if (!findBucket) return new CustomError("Bucket not found", 404);

        await pubsub.publish(PUBSUB_EVENTS.NEW_BUCKET_MESSAGE, {
          newBucketMessage: {
            bucket: findBucket._id,
            message: PUBSUB_EVENTS.NEW_BUCKET_MESSAGE,
          },
        });

        return {
          success: true,
          message: "Message successfully send",
        };
      }
    ),
  },
};

export default bucketResolver;
