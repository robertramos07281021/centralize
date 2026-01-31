import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    bucket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket",
      required: false,
    },
    task: {
      type: Number,
      default: 0,
    },
    code: {
      type: Number,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;