import Branch from "../../models/branch.js";
import CustomError from "../../middlewares/errors.js";
import { safeResolver } from "../../middlewares/safeResolver.js";

const branchResolver = {
  Query: {
    getBranches: safeResolver(async () => {
      return await Branch.find({});
    }),
    getBranch: safeResolver(async (_, { name }) => {
      const res = await Branch.findOne({ name });
      return res;
    }),
  },
  Mutation: {
    createBranch: safeResolver(async (_, { name }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      await Branch.create({ name });
      return { message: "Successfully created branch", success: true };
    }),
    updateBranch: safeResolver(async (_, { id, name }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const updateBranch = await Branch.findByIdAndUpdate(id, {
        $set: { name },
      });
      if (!updateBranch) throw new CustomError("Branch not found", 404);
      return { message: "Branch successfully updated", success: true };
    }),
    deleteBranch: safeResolver(async (_, { id }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const deleteBranch = await Branch.findByIdAndDelete(id);
      if (!deleteBranch) throw new CustomError("Branch not found", 404);
      return { message: "Branch successfully deleted", success: true };
    }),
  },
};

export default branchResolver;
