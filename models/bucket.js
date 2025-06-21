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
    ip: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);


const Bucket = mongoose.model("Bucket", bucketSchema);
export default Bucket;