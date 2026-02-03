import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running...");
});

app.get("/helloworld", (req, res) => {
  res.send("hello world");
});

const PORT = process.env.PORT || 5000;

const initiate = () => {
  connectDB();
  console.log("Database connected successfully");
  console.log(`Server running on PORT ${PORT}`)
}

app.listen(PORT, initiate);