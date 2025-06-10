import mongoose from "mongoose";

const Schema = mongoose.Schema;

const callFileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    bucket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket"
    },
    active: {
      type: Boolean,
      default: true
    },
    endo: {
      type: String
    }
  },
  { timestamps: true }
);


const Callfile = mongoose.model("Callfile", callFileSchema);
export default Callfile;