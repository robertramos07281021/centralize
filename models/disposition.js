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
    disposition: {
      type:mongoose.Schema.Types.ObjectId,
      ref: "DispoType",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    RFD: {
      type: String,
    },
    delayed: {
      type: Boolean,
      default: false
    },
    bucket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket"
    },
    callfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Callfile"
    },
    contact_method: {
      type: String,
      enum: ['calls','sms','email','skip','field'],
    },
    payment: {
      type:String,
      enum: ['partial','full'],
      default: undefined
    },
    dialer: {
      type: String,
      enum: ['issabel','vici','inbound'],
      default: undefined
    },
    chatApp: {
      type: String,
      enum: ['viber','whatsapp','facebook','google','linkedin','gcash','yellowpage','brgy','telegram'],
      default: undefined
    },
    sms: {
      type: String,
      enum: ['openvox','dinstar','inbound','M360'],
      default: undefined
    },
  },
  { timestamps: true }
);

const Disposition = mongoose.model("Disposition", dispositionSchema);
export default Disposition;