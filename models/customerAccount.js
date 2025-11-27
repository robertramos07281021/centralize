import mongoose from "mongoose";
const Schema = mongoose.Schema;

const customerAccountSchema = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    bucket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket",
    },
    assigned: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "assignedModel",
    },
    assignedModel: {
      type: String,
      enum: ["Group", "User", ""],
    },
    current_disposition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Disposition",
    },
    callfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Callfile",
    },
    case_id: {
      type: String,
    },
    account_id: {
      type: String,
    },
    credit_customer_id: {
      type: String,
    },
    endorsement_date: {
      type: String,
    },
    bill_due_date: {
      type: String,
    },
    dpd: {
      type: Number,
      default: 0,
    },
    batch_no: {
      type: String,
    },
    max_dpd: {
      type: Number,
      default: 0,
    },
    month_pd: {
      type: Number,
      default: 0,
    },
    paid_amount: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    assigned_date: {
      type: String,
    },
    on_hands: {
      type: Boolean,
      default: false,
    },
    features: {
      branch: {
        type: String
      },
      account_type: {
        type: String,
        enum: ['call','skip','field'],
        default: 'call'
      },
      called: {
        type: Number,
        default: 0
      },
      alreadyCalled: {
        type: Boolean,
        default: false
      }
    },
    account_update_history: [
      {
        principal_os: {
          type: Number,
        },
        total_os: {
          type: Number,
        },
        balance: {
          type: Number,
        },
        updated_date: {
          type: Date,
        },
        updated_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    from_existing: {
      principal_os: {
        type: Number,
      },
      total_os: {
        type: Number,
      },
      balance: {
        type: Number,
      },
    },
    //object
    out_standing_details: {
      principal_os: {
        type: Number,
        default: 0,
      },
      interest_os: {
        type: Number,
        default: 0,
      },
      admin_fee_os: {
        type: Number,
        default: 0,
      },
      txn_fee_os: {
        type: Number,
        default: 0,
      },
      late_charge_os: {
        type: Number,
        default: 0,
      },
      dst_fee_os: {
        type: Number,
        default: 0,
      },
      waive_fee_os: {
        type: Number,
        default: 0,
      },
      total_os: {
        type: Number,
        default: 0,
      },
      total_balance: {
        type: Number,
        default: 0,
      },
      writeoff_balance: {
        type: Number,
        default: 0,
      },
      overall_balance: {
        type: Number,
        default: 0
      },
      cf: {
        type: Number,
        default: 0,
      },
      mo_balance: {
        type: Number,
        default: 0
      },
      pastdue_amount: {
        type: Number,
        default: 0
      },
      mo_amort: {
        type: Number,
        default: 0
      },
      partial_payment_w_service_fee: {
        type: Number,
        default: 0, 
      },
      new_tad_with_sf: {
        type: Number, 
        default: 0,
      },
      new_pay_off: {
        type: Number,
        default: 0,
      },
      service_fee: {
        type: Number,
        default: 0,
      },
      year: {
        type: String,
      },
      brand: {
        type: String,
      },
      model: {
        type: String,
      },
      last_payment_amount: {
        type: Number,
        default: 0,
      },
      last_payment_date: {
        type: String,
      },
    },
    isPTP: {  
      type: Boolean,
      defualt: false,
    },
    emergency_contact: {
      name: {
        type: String,
      },
      mobile: {
        type: String,
      },
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
      },
    },
    active: {
      type: Boolean,
    },
    history: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Disposition",
      },
    ],
  },
  { timestamps: true }
);

const CustomerAccount = mongoose.model(
  "CustomerAccount",
  customerAccountSchema
);
export default CustomerAccount;
