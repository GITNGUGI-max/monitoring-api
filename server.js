import express from "express"
import { error } from "node:console"
import {appendFile} from "node:fs"

const app = express()
const port = 3001

app.use( (req, res, next)=>{
    res.on("finish", ()=>{
        const timestamp = new Date().toISOString()
        const logLine =                 `${timestamp} | ${req.method} | ${req.path} | ${res.statusCode}` 

    console.log(
        logLine
    )
    appendFile("request.log",  `${logLine}\n`, (error)=>{
        if (error) {
            console.error("Could not save the request log: ", error.message)
        }
    })
    })

    next();
})

app.get("/health", (req, res)=>{
    res.json({
        status:"Ok",
        service:"Monitoring-API"
    })
})

app.get("/metrics", (req, res)=>{
    const memory = process.memoryUsage()
    const memoryMB = memory.rss/1000000

    res.json({
        uptime_seconds: Math.floor(process.uptime()),
        memory_rss_mb: Number(memoryMB.toFixed(2))
    })
})

app.listen(port, ()=>console.log(`Monitor API listening to port ${port}`))