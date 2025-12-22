import express from "express";
import cors from "cors";
import rrroutes from "./routes/route.js";
import mongoose from "mongoose";
const app = express();

app.use(cors());
app.use(express.json({ limit: "1000mb" }));




const MONGO_URI = 'mongodb://localhost:27017/redfalcon_dummy';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB via Mongoose'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Use routes
app.use("/", rrroutes);

app.listen(4006, () => {
  console.log("🚀 Backend running on http://localhost:4006");
});

































