const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const nodemailer = require('nodemailer');
const { Readable } = require('stream');
const Election = require('../models/Election');

// දත්ත මතකයේ (RAM) තබාගැනීමට Multer සැකසීම
const upload = multer({ storage: multer.memoryStorage() });

// ඊමේල් යැවීමේ සේවාදායකය (Nodemailer Transporter)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. POST API - ඡන්දයක් Schedule කිරීම (අප කලින් සෑදූ කොටස)
router.post('/schedule', async (req, res) => {
  try {
    const { title, question, candidates, startTime, endTime } = req.body;
    const newElection = new Election({ title, question, candidates, startTime, endTime });
    await newElection.save();
    res.status(201).json({ message: "ඡන්දය සාර්ථකව Schedule කරන ලදී!", election: newElection });
  } catch (error) {
    res.status(500).json({ error: "දෝෂයක් මතු විය", details: error.message });
  }
});

// 2. POST API - CSV Upload කිරීම සහ ස්වයංක්‍රීයව Emails යැවීම
router.post('/upload-voters', upload.single('voterFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "කරුණාකර CSV ෆයිල් එකක් ලබා දෙන්න." });
  }

  const voters = [];
  const bufferStream = new Readable();
  bufferStream.push(req.file.buffer);
  bufferStream.push(null);

  bufferStream
    .pipe(csv())
    .on('data', (row) => {
      // CSV ෆයිල් එකේ තීරුවේ නම 'email' ලෙස තිබිය යුතුය
      if (row.email) {
        voters.push(row.email);
      }
    })
    .on('end', async () => {
      try {
        // සෑම ඊමේල් ලිපිනයකටම අද්විතීය ලින්ක් එකක් යැවීම
        for (const email of voters) {
          // අනාගතයේදී අපි හදන Voter UI එකේ ලින්ක් එක
          const uniqueLink = `http://localhost:5001/voter/register.html?email=${encodeURIComponent(email)}`;
          
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'E-Voting 2026 - ඡන්දය ප්‍රකාශ කිරීම සඳහා ලියාපදිංචි වන්න',
            text: `ඔබට ඡන්දය ප්‍රකාශ කිරීම සඳහා අවස්ථාව හිමිවී ඇත. කරුණාකර පහත ලින්ක් එක හරහා ගොස් ඔබගේ Fingerprint/FaceID මගින් ලියාපදිංචි වන්න:\n\n${uniqueLink}`
          };

          await transporter.sendMail(mailOptions);
        }
        
        res.status(200).json({ message: `Voters ${voters.length} දෙනෙකුට සාර්ථකව ඊමේල් යවන ලදී!` });
      } catch (error) {
        res.status(500).json({ error: "ඊමේල් යැවීමේදී දෝෂයක් මතු විය.", details: error.message });
      }
    });
});

module.exports = router;