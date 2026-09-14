const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  candidate: { type: String, required: true },
  votedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vote', voteSchema);