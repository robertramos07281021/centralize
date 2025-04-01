import mongoose from "mongoose";
const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    platform_customer_id: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true,
    },
    contact_no: [String],
    emails: [String],
    addresses: [String],
    dob: {
      type: String,
      required: true 
    },
    gender: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;