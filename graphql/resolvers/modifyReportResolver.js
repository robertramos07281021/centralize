import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import ModifyRecord from "../../models/modifyRecord.js";

const modifyReportResolver = {
  DateTime,
  Query: {
    getModifyReport: async (_, { id }) => {
      try {
        return await ModifyRecord.find({ user: id });
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default modifyReportResolver;
