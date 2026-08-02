const mongoose=require("mongoose")
const MONGO_URL=process.env.MONGO_URL;

const connectDB=async()=>{
    try {
        const conn = await mongoose.connect(MONGO_URL);
        console.log(`
        ==================================
        DATABASE CONNECTED ON HOST : ${conn.connection.host}
        ==================================
        `)
    } catch (error) {
        console.error(`
        ==================================
        DATABASE CONNECTION FAILED : ${error.message}
        ==================================
        `)
        process.exit(1)
    }
}

module.exports=connectDB;