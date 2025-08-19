import mongoose from "mongoose";
const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    platform_customer_id: {
      type: String,
    },
    fullName: {
      type: String,
    },
    contact_no: [String],
    emails: [String],
    addresses: [String],
    dob: {
      type: String,
    },
    gender: {
      type: String,
    },
    customer_account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerAccount"
    },
    updatedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      updatedType: {
        type: String,
      }
    }],
    isRPC: {
      type: Boolean,
      default: false
    },
    RPC_date: {
      type: Date
    },
  },
  { timestamps: true }
);

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;