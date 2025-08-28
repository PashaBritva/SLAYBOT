const { EMBED_COLORS } = require("@root/config");
const ServerShop = require("@schemas/Shop");
const { MessageEmbed } = require("discord.js");

module.exports = async function removeitem(guildId, name) {
  const shop = await ServerShop.findOne({ guildId });
  if (!shop) return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("Shop not found.");

  const index = shop.items.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
  if (index === -1) return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("Item not found.");

  const removed = shop.items[index].name;
  shop.items.splice(index, 1);
  await shop.save();

  return new MessageEmbed().setColor(EMBED_COLORS.BOT_EMBED).setTitle("🗑️ Item Removed").setDescription(`Item **${removed}** removed from shop.`);
};
