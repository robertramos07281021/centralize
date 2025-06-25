import mongoose from "mongoose";

const Schema = mongoose.Schema;

const bucketSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true
    },
    dept: {
      type: String,
      required: true,
      uppercase: true
    },
    viciIp: {
      type: String,
    },
    issabelIp: {
      type: String,
    }
  },
  { timestamps: true }
);


const Bucket = mongoose.model("Bucket", bucketSchema);
export default Bucket;