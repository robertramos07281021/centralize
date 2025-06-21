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
      enum: ['caller','skiper','field']
    },
    buckets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket"
    }],
    user_id: {
      type: String,
      unique: true
    },
    new_account: {
      type: Boolean,
      default: true
    },
    default_target: {
      type: Number,
      default: 50000
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group"
    },
    active: {
      type: Boolean,
      default:true 
    },
    attempt_login: {
      type: Number,
      default: 0
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