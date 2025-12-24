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
      ref: "CustomerAccount",
    },
    emergency_contact: {
      name: {
        type: String,
      },
      mobile: {
        type: String,
      },
    },
    updatedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        updatedType: {
          type: String,
        },
      },
    ],
    callfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Callfile",
    },
    isRPC: {
      type: Boolean,
      default: false,
    },
    RPC_date: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound text index for fast search on fullName, contact_no, emails
customerSchema.index({
  fullName: "text",
  contact_no: "text",
  "emergency_contact.mobile": "text",
});

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
