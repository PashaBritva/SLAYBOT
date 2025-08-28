const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, enum: ["custom", "role"], default: "custom" },
  roleId: { type: String, required: false }
});

const Schema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  items: { type: [itemSchema], default: [] },
  balance: { type: Number, default: 0}
});

module.exports = mongoose.model("shop", Schema);
