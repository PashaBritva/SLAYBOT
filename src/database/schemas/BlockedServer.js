const mongoose = require("mongoose");

const blockedServerSchema = new mongoose.Schema({
  serverId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  blockedBy: {
    type: String,
    required: true,
    trim: true
  },
  blockedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date
  },
  isPermanent: {
    type: Boolean,
    default: false
  }
});

blockedServerSchema.pre("save", function(next) {
  if (this.duration > 0 && !this.isPermanent) {
    this.expiresAt = new Date(Date.now() + this.duration);
  }
  next();
});

module.exports = mongoose.model("BlockedServer", blockedServerSchema);