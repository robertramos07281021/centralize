import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      lowercase: true
    },
    type: {
      type: String,
      required: true,
      uppercase: true
    },
    departments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    }],
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch"
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    change_password: {
      type: Boolean,
      default: false
    },
    account_type: {
      type: String ,
      enum: ['caller','skiper','field','']
    },
    buckets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket"
    }],
    user_id: {
      type: String,
    },
    new_account: {
      type: Boolean,
      default: true
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group"
    },
    active: {
      type: Boolean,
      default: true 
    },
    reliver: {
      type: Boolean,
      default: false
    },
    attempt_login: {
      type: Number,
      default: 0
    },
    callfile_id: {
      type: String,
    },
    new_agent: {
      type: Boolean,
      default: true
    },
    vici_id: {
      type: String,
    },
    softphone: {
      type: String,
    },
    targets: {
      daily: {
        type: Number,
        default: 0,
      },
      weekly: {
        type: Number,
        default: 0,
      },
      monthly: {
        type: Number,
        default: 0
      },
      daily_variance: {
        type: Number,
        default: 0
      },
      weekly_variance: {
        type: Number,
        default: 0
      },
      monthly_variance: {
        type: Number,
        default: 0
      },
    },
    handsOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerAccount"
    },
    phone_login: {
      type: String,
    },
    isLock: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;