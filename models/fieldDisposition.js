import mongoose from "mongoose";

const Schema = mongoose.Schema;

const fieldDispositionSchema = new Schema(
  {
    disposition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DispoType",
      required: true,
    },
    payment_method: {
      type: String,
    },
    payment: {
      type: String,
      enum: ["partial", "full"],
    },
    payment_date: {
      type: String,
    },
    amount: {
      type: Number,
    },
    ref_no: {
      type: String,
    },
    rfd: {
      type: String,
    },
    sof: {
      type: String,
    },
    customer_account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerAccount",
      required: true,
    },
    callfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Callfile",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true },
);

const FieldDisposition = mongoose.model(
  "FieldDisposition",
  fieldDispositionSchema,
);

export default FieldDisposition;
