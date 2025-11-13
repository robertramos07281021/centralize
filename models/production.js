import mongoose from "mongoose";

const Schema = mongoose.Schema;

const productionSchema = new Schema(
  {
    prod_history: [{
      type: {
        type: String,
        enum: ['LUNCH','COFFEE','MEETING','TECHSUPP','CRBREAK','COACHING','HRMEETING','HANDSETNEGO','SKIPTRACING','CLINIC','PROD','LOCK','REPORTS']
      },
      existing: {
        type: Boolean
      },
      start: {
        type: String
      },
      end: {
        type: String
      },
    }],
    assignedAccount: {
      type: Number
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
  },
  { timestamps: true }
);

const Production = mongoose.model("Production", productionSchema);
export default Production;