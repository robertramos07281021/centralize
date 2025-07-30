import mongoose from "mongoose";
import { ref } from "process";



const Schema = mongoose.Schema;

const dispositionTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true,
      unique: true
    },
    code: {
      type: String,
      required: true,
      uppercase:true,
      unique: true
    },
    buckets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket" 
    }],
    rank: {
      type: Number,
      default: 0,
    },
    status: {
      type: Number,
      default: 0
    },
    contact_methods: {
      skipper : {
        type: Boolean,
        default: false
      },
      field: {
        type: Boolean,
        default: false
      },
      caller: {
        type: Boolean,
        default: false
      }
    },
    active: {
      type: Boolean,
      default: true
    }
  },{timestamps: true}
);

const DispoType = mongoose.model("DispoType", dispositionTypeSchema);
export default DispoType;