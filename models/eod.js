import mongoose from "mongoose";
const Schema = mongoose.Schema;

const eodSchema = new Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    ticketNo: {
      type: String,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["on going", "solved", "pending"],
    },
    recommendation: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    finishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const EOD = mongoose.model("EOD", eodSchema);
export default EOD;
