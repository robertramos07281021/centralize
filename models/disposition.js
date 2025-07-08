import mongoose from "mongoose";
const Schema = mongoose.Schema;

const dispositionSchema = new Schema(
  {
    amount: {
      type: Number,
    },
    customer_account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerAccount",
      required: true
    },
    payment: {
      type:String,
    },
    disposition: {
      type:mongoose.Schema.Types.ObjectId,
      ref: "DispoType",
      required: true
    },
    payment_date: {
      type: String,
    },
    payment_method: {
      type: String,
    },
    ref_no: {
      type: String,
    },
    comment: {
      type: String
    },
    existing: {
      type: Boolean,
      default: true
    },
    ptp: {
      type: Boolean,
      default: false
    },
    contact_method: {
      type: String,
      enum: ['calls','sms','email','skip','field']
    },
    dialer: {
      type: String,
      enum: ['issabel','vici',"",'inbound']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

const Disposition = mongoose.model("Disposition", dispositionSchema);
export default Disposition;