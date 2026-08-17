import mongoose from "mongoose";

export async function connectDB() {
    try {
        const mongooseURI = process.env.MONGO_URI;

        if (!mongooseURI) {
            throw new Error("MONGO_URI is required");
        }

        const conn = await mongoose.connect(mongooseURI);

        console.log(
            "MongoDB Connected Successfully:",
            conn.connection.host
        );

        return conn;
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        throw error;
    }
}