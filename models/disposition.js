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
      default: false
    },
    ptp: {
      type: Boolean,
      default: false
    },
    RFD: {
      type: String,
    },
    callId: {
      type:String
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
      enum: ['call','sms','email','skip','field'],
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
      enum: ['viber','whatsapp','facebook','google','linkedin','gcash','yellowpage','brgy','telegram',],
      default: undefined
    },
    sms: {
      type: String,
      enum: ['openvox','dinstar','inbound','M360'],
      default: undefined
    },
    selectivesDispo: {
      type: Boolean,
      default: false
    },
    selectiveFiles: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Selective"
    },
    paidDispo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Disposition'
    },
    features: {
      partialPayment: {
        type: Number,
      },
      SOF: {
        type: String
      }
    }
  },
  { timestamps: true }
);




dispositionSchema.pre("save", function (next) {
  if (this.isNew && this.createdAt) {
    this.$__.timestamps = false; 
  }
  next();
});


dispositionSchema.pre("insertMany", function (next, docs) {
  docs.forEach(doc => {
    if (doc.createdAt) {
      doc.$__.timestamps = false;
    }
  });
  next();
});

const Disposition = mongoose.model("Disposition", dispositionSchema);
export default Disposition;