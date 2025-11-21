import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import reportsRouter from "./routes/reports.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Mount API routes
app.use("/api/reports", reportsRouter);

// Connect to MongoDB (supports local URI or cluster URI set in MONGO_URI)
const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/garbage_db";
mongoose
  .connect(mongoUri, { dbName: process.env.DB_NAME || undefined })
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
// Serve uploaded images
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
