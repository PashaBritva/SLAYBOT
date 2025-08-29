const mongoose = require("mongoose");

const temporaryRoleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  roleId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model("TemporaryRole", temporaryRoleSchema);
