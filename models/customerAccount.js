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
    bill_due_date: {
      type: String
    },
    dpd: {
      type: Number,
      default: 0
    },
    batch_no: {
      type: String,
    },
    max_dpd: {
      type: Number,
      default: 0
    },
    month_pd: {
      type: Number,
      default: 0
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
    account_update_history: [
      {
        principal_os: {
          type: Number
        },
        total_os: {
          type: Number
        },
        balance: {
          type: Number
        },
        updated_date: {
          type: Date
        },
        updated_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      }
    ],
    from_existing: {
      principal_os: {
        type: Number
      },
      total_os: {
        type: Number
      },
      balance: {
        type: Number
      },
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
      waive_fee_os: {
        type: Number,
        default: 0
      },
      total_os: {
        type: Number,
        default: 0
      },
      total_balance: {
        type: Number,
        default: 0
      }
    },
    isPTP: {
      type: Boolean,
      defualt: false
    },
    emergency_contact: {
      name: {
        type: String,
      },
      mobile: {
        type: String
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
    active: {
      type: Boolean
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