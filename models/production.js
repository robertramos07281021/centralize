import mongoose from "mongoose";

const Schema = mongoose.Schema;

const productionSchema = new Schema(
  {
    prod_history: [{
      type: {
        type: String,
        enum: ['LUNCH','COFFEE','MEETING','TECHSUPP','CRBREAK','COACHING','HRMEETING','HANDSETNEGO','SKIPTRACING','CLINIC','PROD']
      },
      existing: {
        type: Boolean
      },
      start: {
        type: String
      },
      end: {
        type: String
      }
    }],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    target_today: {
      type: Number
    }
  },
  { timestamps: true }
);

const Production = mongoose.model("Production", productionSchema);
export default Production;