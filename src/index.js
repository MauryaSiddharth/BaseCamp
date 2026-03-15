import 'dotenv/config'
import app from './app.js'
import  connectDB from './db/index.js'

const port= process.env.PORT ||3000;

connectDB()
  .then(()=>{
    app.listen(port,()=>{
        console.log(`server is running at https://localhost:${port}`);
        
    })
  })
  .catch((err)=>{
    console.log("mongodb connection error",err);
    process.exit(1)
    
  })






// import dotenv from "dotenv"
// dotenv.config({
//     path:'./.env',
// })