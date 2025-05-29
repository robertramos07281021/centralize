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
    default_target: {
      type: Number
    },
    target_today: {
      type: Number
    }
  },
  { timestamps: true }
);

const Production = mongoose.model("Production", productionSchema);
export default Production;