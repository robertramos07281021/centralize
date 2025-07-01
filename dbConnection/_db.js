import mongoose from "mongoose";
import "dotenv/config.js"

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL,{
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 10000,
    });
    console.log("✅ MongoDB Connected...");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;
