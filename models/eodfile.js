import mongoose from "mongoose";
const Schema = mongoose.Schema;

const eodFileSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const EODFile = mongoose.model("EODFile", eodFileSchema);
export default EODFile;
