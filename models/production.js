import mongoose from "mongoose";

const Schema = mongoose.Schema;

const productionSchema = new Schema(
  {
    account_history: [{
      type: {
        type: String,
      },
      time: {
        type: String
      }
    }],
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