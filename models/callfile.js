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
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);


const Callfile = mongoose.model("Callfile", callFileSchema);
export default Callfile;