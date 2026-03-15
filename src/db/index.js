 import mongoose from 'mongoose'

const connectDB= async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("✅ MongoDB CONNECTED ");
        
        
    } catch (error) {
         console.error("❌ mongodb not connected succesfully",error)
         process.exit();
    }
}

export default connectDB