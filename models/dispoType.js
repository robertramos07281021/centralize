import mongoose from "mongoose";



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
    }
  },
);

const DispoType = mongoose.model("DispoType", dispositionTypeSchema);
export default DispoType;