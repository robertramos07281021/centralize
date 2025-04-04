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
      type: String,
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