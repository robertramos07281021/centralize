import mongoose from "mongoose";
const Schema = mongoose.Schema;

const customerAccountSchema = new Schema(
  {
    customer:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer"
    },
    bucket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket"
    },
    assigned: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'assignedModel'
    },
    assignedModel: {
      type: String,
      enum: ['Group', 'User']
    },
    current_disposition: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Disposition",
    },
    callfile: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Callfile"
    },
    case_id: {
      type: String,
    },
    account_id: {
      type:String
    },
    credit_customer_id: {
      type: String,
    },
    endorsement_date: {
      type: String,
    }, 
    bill_due_day: {
      type: Number
    },
    max_dpd: {
      type: Number
    },
    paid_amount: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    assigned_date: {
      type: String
    },
    on_hands: {
      type: Boolean,
      default: false
    },
    //object
    out_standing_details: {
      principal_os: {
        type: Number,
        default: 0
      },
      interest_os: {
        type: Number,
        default: 0
      },
      admin_fee_os: {
        type: Number,
        default: 0
      },
      txn_fee_os: {
        type: Number,
        default: 0
      },
      late_charge_os: {
        type: Number,
        default: 0
      },
      dst_fee_os: {
        type: Number,
        default: 0
      },
      total_os: {
        type: Number,
        default: 0
      }
    },
    //object
    grass_details: {
      grass_region: {
        type: String,
      },
      vendor_endorsement: {
        type: String,
      },
      grass_date: {
        type: String,
      }
    },
    history: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Disposition"
    }]
  },
  { timestamps: true }
);

const CustomerAccount = mongoose.model("CustomerAccount", customerAccountSchema);
export default CustomerAccount;