import express from 'express'
import cors from 'cors'
import healthCheckRouter from './routes/healthcheck.routes.js'

const app= express();

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

//  using routes
app.use("/api/v1/healthcheck",healthCheckRouter)

//  cors configuration
app.use(cors({
    origin:process.env.CORS_ORIGIN?.split(",") || "https://localhost:5173",
    credentials:true,
    methods:["GET","POST","PUT","OPTION","PATCH","DELETE"],
    allowedHeaders:["Authorization","Content-Type"]
}))

app.get("/",(req,res)=>{
    res.send("working hai ")
})
export default app;
