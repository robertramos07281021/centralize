import mongoose from "mongoose";

const Schema = mongoose.Schema;

const productionSchema = new Schema(
  {
    in_out: {
      f_break: {
        type: String
      },
      f_break_end: {
        type: String
      },
      s_break: {
        type: String
      },
      s_break_end: {
        type: String
      },
      lunch: {
        type: String,
      },
      lunch_end: {
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
    dispositions: [{
      type: mongoose.Schema.ObjectId,
      ref: "Disposition"
    }]
  },
  { timestamps: true }
);

const Production = mongoose.model("Production", productionSchema);
export default Production;