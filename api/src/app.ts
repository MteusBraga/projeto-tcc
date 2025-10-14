// server.ts
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import router from "./routes/index.ts";

const app = express();

app.use(bodyParser.json()).use(cors()).use(router);

export { app };
