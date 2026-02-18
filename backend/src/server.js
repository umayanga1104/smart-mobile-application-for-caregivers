import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js"

dotenv.config();

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST" ,"PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

//connec Database
connectDB();

//Initial log
app.get("/", (req, res) => {
  res.send("API running...");
});

//All user related API endpoints
app.use("/api/user", userRoutes);

//Bravo six going dark
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);