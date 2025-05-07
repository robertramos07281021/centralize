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
    department: {
      type: String,
    }, 
    branch: {
      type: String,
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    change_password: {
      type: Boolean,
      default: false
    },
    bucket: {
      type: String
    },
    user_id: {
      type: String,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group"
    },
    active: {
      type: Boolean,
      default:true 
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;