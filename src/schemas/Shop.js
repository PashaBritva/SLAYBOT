const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String, default: null },
    },
  ],
  bank: { type: Number, required: true, default: 0}
});

module.exports = mongoose.model("shop", Schema);
