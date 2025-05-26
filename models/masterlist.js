import mongoose from "mongoose";

const Schema = mongoose.Schema;

const masterlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true
    },
  },
  { timestamps: true }
);


const Masterlist = mongoose.model("masterlist", masterlistSchema);
export default Masterlist;