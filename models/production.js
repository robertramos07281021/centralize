import mongoose from "mongoose";

const Schema = mongoose.Schema;

const productionSchema = new Schema(
  {
    in_out: {
      lunch: {
        type: String,
      },
      out: {
        type: String
      }
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    disposition: [{
      type: mongoose.Schema.ObjectId,
      ref: "Disposition"
    }]
  },
  { timestamps: true }
);

const Production = mongoose.model("Production", productionSchema);
export default Production;