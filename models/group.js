import mongoose from "mongoose";



const Schema = mongoose.Schema;

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true,
      unique: true
    },
    member: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
    ],
    description: {
      type: String,
    }
    
  },
);

const Group = mongoose.model("Group", groupSchema);
export default Group;