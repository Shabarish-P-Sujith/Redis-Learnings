import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log("MONGODB_URL:", process.env.MONGODB_URL);
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
    }
}

export default connectDB;