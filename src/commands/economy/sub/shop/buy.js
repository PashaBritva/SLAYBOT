const ServerShop = require("@schemas/Shop");
const { MessageEmbed } = require("discord.js");
const transfer = require("../transfer");
const { ECONOMY } = require("@root/config");

module.exports = async function buy(guildId, user, name) {
  const shop = await ServerShop.findOne({ guildId });
  if (!shop) return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("Shop not found.");

  const item = shop.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!item) return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("Item not found.");

  const result = await transfer(user, null, item.price, guildId);
  if (result.embeds && result.embeds[0].title && result.embeds[0].title.startsWith("❌")) {
    return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("Please top up your bank account for payment.");
  }

  return new MessageEmbed().setColor("GREEN").setTitle("✅ Purchase Successful").setDescription(`You bought **${item.name}** for **${item.price}**${ECONOMY.CURRENCY}.`);
};
