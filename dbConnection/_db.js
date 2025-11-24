import mongoose from "mongoose";
import "dotenv/config.js";

// mongoose.set("debug", true);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 10 * 60 * 1000, // 10 minutes
      serverSelectionTimeoutMS: 10 * 1000, // 10 seconds
      connectTimeoutMS: 10 * 1000,
    });
    console.log("✅ MongoDB Connected...");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;
