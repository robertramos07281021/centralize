import { DateTime } from "../../middlewares/dateTime.js";

import { safeResolver } from "../../middlewares/safeResolver.js";
import ModifyRecord from "../../models/modifyRecord.js";

const modifyReportResolver = {
  DateTime,
  Query: {
    getModifyReport: safeResolver(async (_, { id }) => {
      return await ModifyRecord.find({ user: id });
    }),
  },
};

export default modifyReportResolver;
