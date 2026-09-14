const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  webauthnUserId: { type: String },
  credentialID: { type: String },
  credentialPublicKey: { type: Buffer },
  counter: { type: Number, default: 0 },
  currentChallenge: { type: String },
  hasVoted: { type: Boolean, default: false }

});

module.exports = mongoose.model('User', userSchema);