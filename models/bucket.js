import mongoose from "mongoose";

const Schema = mongoose.Schema;

const bucketSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true
    },
    principal: {
      type: Boolean,
      default: false
    },
    dept: {
      type: String,
      required: true,
      uppercase: true
    },
    viciIp: {
      type: String,
    },
    viciIp_auto: {
      type: String
    },
    issabelIp: {
      type: String,
    },
    isPermanent: {
      type: Boolean,
      default: false
    },
    message: {
      type:String
    },
    can_update_ca: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    canCall: {
      type: Boolean,
      default: false
    },
    target_details: {
      default_target_daily: {
        type: Number,
        default: 0,
      },
      default_target_weekly: {
        type: Number,
        default: 0
      },
      default_target_monthyl: {
        type: Number,
        default: 0
      },
      auto_add_target: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);


const Bucket = mongoose.model("Bucket", bucketSchema);
export default Bucket;