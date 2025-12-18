import mongoose from "mongoose";
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import PatchUpdates from "../../models/updateAndNews.js";

const patchUpdateResolver = {
  DateTime,
  Query: {
    getPushedPatch: async () => {
      try {
        return await PatchUpdates.find({ pushPatch: true }).lean();
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    getAllPatchUpdates: async () => {
      try {
        return await PatchUpdates.find().lean();
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    getPatchUpdatesConsolidated: async () => {
      try {
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
              info: 1
            }
          },
          {
            $sort: {type: 1}
          }
        ]);

        return res 
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  Mutation: {
    addPatchUpdate: async (_, { input }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthenticate", 401);

        await PatchUpdates.create(input);

        return {
          success: true,
          message: "Patch update successfully updated created",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    updatePatchUpdate: async (_, { id, input }, { user }) => {
      try {
        console.log(id);
        if (!user) throw new CustomError("Unauthenticate", 401);

        const findPatchAndUpdate = await PatchUpdates.findByIdAndUpdate(id, {
          $set: input,
        });

        if (!findPatchAndUpdate) throw new CustomError("Patch not found", 404);

        return {
          success: true,
          message: "Successfully update patch update",
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    pushPatch: async (_, __, { user }) => {
      try {
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
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    removePatch: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthenticate", 401);
        await PatchUpdates.deleteMany({
          pushPatch: true,
        });
        return {
          success: true,
          message: "Successfully removed patch update",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    deletePatchUpdate: async (_, { _id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthenticate", 401);

        const res = await PatchUpdates.findByIdAndDelete(_id);
        if (!res) throw new CustomError("Patch not found", 404);
        return {
          success: true,
          message: "Successfully delete patch update",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default patchUpdateResolver;
