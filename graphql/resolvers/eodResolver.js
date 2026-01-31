import EOD from "../../models/eod.js";
import EODFile from "../../models/eodfile.js";
import CustomError from "../../middlewares/errors.js";
import { safeResolver } from "../../middlewares/safeResolver.js";

const eodResolver = {
  Query: {
    getEODFiles: safeResolver(async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const eodFiles = await EODFile.find({ user: user._id }).sort({
        createdAt: -1,
      });

      return eodFiles.map((file) => ({
        _id: file._id,
        user: file.user,
        name: file.name,
        createdAt: file.createdAt.getTime().toString(),
      }));
    }),
  },

  Mutation: {
    finishEODs: safeResolver(async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const unfinishedEODs = await EOD.find({
        createdBy: user._id,
        createdAt: { $gte: today, $lt: tomorrow },
        finishedAt: null,
      });

      if (unfinishedEODs.length === 0) {
        throw new CustomError("No unfinished EOD entries found for today", 400);
      }

      const eodFile = new EODFile({
        user: user._id,
        name: user.name,
      });
      await eodFile.save();

      await EOD.updateMany(
        {
          _id: { $in: unfinishedEODs.map((eod) => eod._id) },
        },
        {
          finishedAt: eodFile.createdAt,
        }
      );

      return {
        _id: eodFile._id,
        user: eodFile.user,
        name: eodFile.name,
        createdAt: eodFile.createdAt.getTime().toString(),
      };
    }),
  },
};

export default eodResolver;
