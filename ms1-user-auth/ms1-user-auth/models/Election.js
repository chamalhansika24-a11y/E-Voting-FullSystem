const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  question: { type: String, required: true },
  candidates: { type: [String], required: true }, // අපේක්ෂකයින්ගේ නම් ඇතුළත් Array එකක්
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, default: 'scheduled' }
});

module.exports = mongoose.model('Election', electionSchema);