const express = require('express');
const router = express.Router();
const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions, 
  verifyAuthenticationResponse,
  isoUint8Array 
} = require('@simplewebauthn/server');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const rpName = 'E-Voting System';
const rpID = 'localhost';
const origin = `http://${rpID}:5500`;

// Step A: Send options for biometric registration
router.post('/register/options', async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({ email });
      await user.save();
    }

    const byteUserId = new Uint8Array(
      user._id.toString().split('').map(char => char.charCodeAt(0))
    );

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: byteUserId,
      userName: user.email,
      attestationType: 'none',
      authenticatorSelection: { 
        authenticatorAttachment: 'platform', // බාහිර උපාංග ඉල්ලීම වැළැක්වීමට සහ ලැප්ටොප් එකේ Windows Hello / TouchID භාවිත කිරීමට
        residentKey: 'required', 
        userVerification: 'required' 
      },
    });

    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step B: Verify fingerprint and save to database
// පියවර B: Fingerprint එක Verify කර Database එකේ Save කිරීම
router.post('/register/verify', async (req, res) => {
  try {
    const { email, response } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ verified: false, error: "User not found." });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      const regInfo = verification.registrationInfo;
      
      // විවිධ version වලදී දත්ත එන ආකාරයට අනුව සකසා ගැනීම
      const credentialID = regInfo.credentialID || regInfo.credential?.id;
      const credentialPublicKey = regInfo.credentialPublicKey || regInfo.credential?.publicKey;
      const counter = regInfo.counter;

      if (!credentialID || !credentialPublicKey) {
        throw new Error("Credential ID or Public Key is missing from registration info.");
      }
      
      user.credentialID = Buffer.isBuffer(credentialID) ? credentialID.toString('base64url') : Buffer.from(credentialID).toString('base64url');
      user.credentialPublicKey = Buffer.isBuffer(credentialPublicKey) ? credentialPublicKey : Buffer.from(credentialPublicKey);
      user.counter = counter;
      user.currentChallenge = undefined;
      await user.save();

      res.json({ verified: true, message: "Biometric registration successful!" });
    } else {
      res.status(400).json({ verified: false, error: "Verification failed." });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ verified: false, error: error.message });
  }
});



router.post('/login/options', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.credentialID) {
      return res.status(404).json({ error: "පරිශීලකයා ලියාපදිංචි වී නොමැත." });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });

    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step D: Verify login and issue JWT token
router.post('/login/verify', async (req, res) => {
  try {
    const { email, response } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "පරිශීලකයා හමු නොවීය." });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: 'http://localhost:5500',
      expectedRPID: rpID,
      credential: {
        id: Buffer.from(user.credentialID, 'base64'),
        publicKey: Buffer.from(user.credentialPublicKey, 'base64'),
        counter: user.counter || 0,
      },
    });

    if (verification.verified) {
      user.counter = verification.authenticationInfo.newCounter;
      user.currentChallenge = undefined; // Challenge එක ඉවත් කිරීම
      await user.save();

      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
  { userId: user._id, email: user.email }, 
  process.env.JWT_SECRET || "my_super_secret_voting_key_2026", 
  { expiresIn: '1h' }
);

      res.json({ verified: true, token });
    } else {
      res.json({ verified: false, error: "Verification failed" });
    }
  } catch (error) {
    console.error("Login verification error:", error);
    res.status(500).json({ verified: false, error: error.message });
  }
});

module.exports = router;