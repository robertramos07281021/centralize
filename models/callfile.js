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
    masterlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Masterlist"
    },
    collected:{
      type: Number
    },
    target: {
      type: Number
    }
  },
  { timestamps: true }
);


const Callfile = mongoose.model("Callfile", callFileSchema);
export default Callfile;