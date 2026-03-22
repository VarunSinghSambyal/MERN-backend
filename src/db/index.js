import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const ConnectDB = async () => {
  try {
    const uri = process.env.MongoDB_URI;
    const connectionInstance = await mongoose.connect(uri, {
      dbName: DB_NAME,
    });
    console.log(`Connected to MongoDB: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default ConnectDB;