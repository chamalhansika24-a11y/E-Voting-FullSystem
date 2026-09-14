require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // JSON දත්ත කියවීමට

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


const voteRoutes = require('./routes/voteRoutes'); 
app.use('/api/vote', voteRoutes); 

// MongoDB Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Database Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Test Route
app.get("/api/status", (req, res) => {
  res.json({ message: "MS1 (User & Auth Service) is running smoothly!" });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 MS1 Server running on http://localhost:${PORT}`);
});