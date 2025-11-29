import mongoose from "mongoose";

const { Schema } = mongoose;

const scoreCardDataSchema = new Schema(
  {
    month: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    agentName: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateAndTimeOfCall: {
      type: Date,
      required: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
    },
    assignedQA: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    typeOfScoreCard: {
      type: String,
      default: "Default Score Card",
      trim: true,
    },
    scoreDetails: {
      type: Schema.Types.Mixed,
      default: {},
    },
    totalScore: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const ScoreCardData = mongoose.model("ScoreCardData", scoreCardDataSchema);
export default ScoreCardData;
