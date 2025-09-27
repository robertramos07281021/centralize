import mongoose from "mongoose";

const Schema = mongoose.Schema;

const selectiveSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    callfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Callfile"
    }
  },
  { timestamps: true }
);

const Selective = mongoose.model("Selective", selectiveSchema);
export default Selective;