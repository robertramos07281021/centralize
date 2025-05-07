import mongoose from "mongoose";

const Schema = mongoose.Schema;

const deptSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true
    },
    branch: {
      type: String,
      required: true
    },
    aom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
  },
  { timestamps: true }
);

const Department = mongoose.model("Department", deptSchema);
export default Department;