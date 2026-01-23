import CustomError from "./errors.js";

export const safeResolver =
  (resolver) => async (parent, args, context, info) => {
    try {
      return await resolver(parent, args, context, info);
    } catch (err) {
      if (err instanceof CustomError) {
        console.log(err)
        throw err;
      }
      throw new CustomError(err.message || "Internal server error", 500);
    }
  };
