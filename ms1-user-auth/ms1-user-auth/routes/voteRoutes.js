const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // axios නොමැති නම් npm install axios කරන්න
const User = require('../models/User');

const router = express.Router();

// JWT Token Verification Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access Denied. Please login first." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || "my_super_secret_voting_key_2026"); 
    req.user = verified;
    next();
  } catch (error) {
    return res.status(400).json({ error: "Invalid or expired token." });
  }
};

// ඡන්දය ප්‍රකාශ කර MS2 වෙත Forward කරන Route එක
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { candidate } = req.body;

    // 1. පරිශීලකයා සොයා ගැනීම
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    // 2. Double Voting වැළැක්වීම (කලින් ඡන්දය දී ඇත්දැයි පරීක්ෂාව)
    if (user.hasVoted) {
      return res.status(400).json({ error: "You have already cast your vote." });
    }

    // 3. Microservice 2 (Voting Core) වෙත ඡන්දය Forward කිරීම
    const ms2Url = process.env.MS2_URL || 'http://ms2_voting:5002/api/vote/cast';
    const ms2Response = await axios.post(ms2Url, { candidate });

    // 4. MS2 එකෙන් Success ආවොත් පමණක් පරිශීලකයා ඡන්දය ලබා දුන් බව MS1 DB හි සටහන් කිරීම
    user.hasVoted = true;
    await user.save();

    return res.json({ 
      success: true, 
      message: "Vote cast successfully on Blockchain!",
      blockchainTx: ms2Response.data
    });

  } catch (error) {
    console.error("Voting forwarding error:", error.response ? error.response.data : error.message);
    return res.status(500).json({ error: "Failed to record vote on Blockchain." });
  }
});

module.exports = router;