import mongoose from "mongoose";
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Selective from "../../models/selective.js";
import Bucket from "../../models/bucket.js";
import Disposition from "../../models/disposition.js";

const selectivesResolver = {
  DateTime,
  Query: {
    getAllSelectives: async (_, { page, limit, bucket }) => {
      try {
        if (!bucket) return null;

        const findBucket = await Bucket.findById(bucket);

        const skip = (page - 1) * limit;
        const res = await Selective.aggregate([
          {
            $lookup: {
              from: "callfiles",
              localField: "callfile",
              foreignField: "_id",
              as: "selective_callfile",
            },
          },
          {
            $unwind: {
              path: "$selective_callfile",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "selective_callfile.bucket",
              foreignField: "_id",
              as: "selective_bucket",
            },
          },
          {
            $unwind: {
              path: "$selective_bucket",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "selective_bucket._id": new mongoose.Types.ObjectId(
                findBucket._id
              ),
            },
          },
          {
            $facet: {
              selectives: [
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    callfile: "$selective_callfile",
                    bucket: "$selective_bucket",
                    createdAt: 1,
                  },
                },
                { $skip: skip },
                { $limit: limit },
              ],
              total: [{ $count: "totalSelective" }],
            },
          },
        ]);

        const selectives = res[0].selectives ?? [];

        const newSelectives = await Promise.all(
          selectives.map(async (selective) => {
            const dispositions = await Disposition.aggregate([
              {
                $match: {
                  selectiveFiles: new mongoose.Types.ObjectId(selective._id),
                },
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  amount: { $sum: "$amount" },
                },
              },
            ]);

            const count = dispositions[0]?.count ?? 0;
            const amount = dispositions[0]?.amount ?? 0;

            return {
              ...selective,
              count,
              amount,
            };
          })
        );

        const total =
          res[0].total.length > 0 ? res[0].total[0].totalSelective : 0;

        return {
          selectives: newSelectives,
          total,
        };
        
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default selectivesResolver;
