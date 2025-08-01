import mongoose from "mongoose";
import CustomerAccount from "./customerAccount.js";
import Customer from "./customer.js";
import CustomError from "../middlewares/errors.js";

const Schema = mongoose.Schema;

const callFileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    bucket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket"
    },
    active: {
      type: Boolean,
      default: true
    },
    endo: {
      type: String
    },
    finished_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    totalAccounts: {
      type: Number
    },
    totalPrincipal: {
      type: Number
    }
  },
  { timestamps: true }
);

callFileSchema.post('findOneAndDelete',async(data) => {
  try {
    if(data) {
      const accounts = await CustomerAccount.find({callfile: data._id})
      const customerIds = accounts.map(acc => acc.customer);
      await Customer.deleteMany({ _id: { $in: customerIds } });
      await CustomerAccount.deleteMany({ callfile: data._id });
    }
  } catch (error) {
    throw new CustomError(error.message, 500)
  }
})


const Callfile = mongoose.model("Callfile", callFileSchema);
export default Callfile;