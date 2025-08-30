const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  ownerId: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["role", "channel", "user", "custom"], 
    required: true 
  },
  item: { type: String, required: true },
  startPrice: { type: Number, required: true },
  highestBid: { type: Number, default: 0 },
  highestBidder: { type: String, default: null },
  endTime: { type: Date, required: true },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model("auction", auctionSchema);
