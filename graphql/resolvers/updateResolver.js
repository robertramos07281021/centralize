import mongoose from "mongoose";
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import PatchUpdates from "../../models/updateAndNews.js";
import { safeResolver } from "../../middlewares/safeResolver.js";

const patchUpdateResolver = {
  DateTime,
  Query: {
    getPushedPatch: safeResolver(async () => {
      return await PatchUpdates.find({ pushPatch: true }).lean();
    }),
    getAllPatchUpdates: safeResolver(async () => {
      return await PatchUpdates.find().lean();
    }),

    getPatchUpdatesConsolidated: safeResolver(async () => {
      const res = await PatchUpdates.aggregate([
        {
          $group: {
            _id: "$type",
            info: {
              $push: { title: "$title", descriptions: "$descriptions" },
            },
          },
        },
        {
          $project: {
            _id: 0,
            type: "$_id",
            info: 1,
          },
        },
        {
          $sort: { type: 1 },
        },
      ]);

      return res;
    }),
  },
  Mutation: {
    addPatchUpdate: safeResolver(async (_, { input }, { user }) => {
      if (!user) throw new CustomError("Unauthenticate", 401);

      await PatchUpdates.create(input);

      return {
        success: true,
        message: "Patch update successfully updated created",
      };
    }),
    updatePatchUpdate: safeResolver(async (_, { id, input }, { user }) => {
      if (!user) throw new CustomError("Unauthenticate", 401);

      const findPatchAndUpdate = await PatchUpdates.findByIdAndUpdate(id, {
        $set: input,
      });

      if (!findPatchAndUpdate) throw new CustomError("Patch not found", 404);

      return {
        success: true,
        message: "Successfully update patch update",
      };
    }),
    pushPatch: safeResolver(async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthenticate", 401);
      await PatchUpdates.updateMany(
        {
          pushPatch: false,
        },
        {
          $set: {
            pushPatch: true,
          },
        }
      );
      return {
        success: true,
        message: "Successfully push patch update",
      };
    }),
    removePatch: safeResolver(async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthenticate", 401);
      await PatchUpdates.deleteMany({
        pushPatch: true,
      });
      return {
        success: true,
        message: "Successfully removed patch update",
      };
    }),
    deletePatchUpdate: safeResolver(async (_, { _id }, { user }) => {
      if (!user) throw new CustomError("Unauthenticate", 401);

      const res = await PatchUpdates.findByIdAndDelete(_id);
      if (!res) throw new CustomError("Patch not found", 404);
      return {
        success: true,
        message: "Successfully delete patch update",
      };
    }),
  },
};

export default patchUpdateResolver;
