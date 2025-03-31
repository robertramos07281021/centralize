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
    contact_no: [
      {
        mobile: {
          type:String
        }
      }
    ],
    emails: [{
      email: {
        type: String,
      }
    }],
    addresses: [{
      address: {
        type: String,
      } 
    }],
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