import mongoose from "mongoose";

const Schema = mongoose.Schema;

const updateAndNewsSchema = new Schema(
  {
    type: {
      type: String
    },
    title: {
      type: String,
    },
    descriptions: {
      type: String
    },
    pushPatch: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const PatchUpdates = mongoose.model("PatchUpdate", updateAndNewsSchema);
export default PatchUpdates;