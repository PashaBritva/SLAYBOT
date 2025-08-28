const ServerShop = require("@schemas/Shop");
const { MessageEmbed } = require("discord.js");
const deposit = require("../deposit");
const { ECONOMY } = require("@root/config");

module.exports = async function sell(guildId, user, name) {
  const shop = await ServerShop.findOne({ guildId });
  if (!shop) return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("Shop not found.");

  const item = shop.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!item) return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("Item not found.");

  const refund = Math.floor(item.price / 2);
  await deposit(user, refund);

  return new MessageEmbed().setColor("ORANGE").setTitle("♻️ Item Sold").setDescription(`You sold **${item.name}** for **${refund}**${ECONOMY.CURRENCY}.`);
};
