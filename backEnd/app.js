import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import allRoutes from "./src/routes/allRoutes/index.js";

const app = express();

// Middlewares
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

const api = process.env.API_URL || "/api";

//Todas las rutas se encuentran en: ./routes/index.js
app.use(api, allRoutes);

export default app;