import mongoose from "mongoose";
const Schema = mongoose.Schema;

const modifyRecordSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
  },
  { timestamps: true }
);

const ModifyRecord = mongoose.model("ModifyRecord", modifyRecordSchema);
export default ModifyRecord;