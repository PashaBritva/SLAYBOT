const { EMBED_COLORS, ECONOMY } = require("@root/config");
const ServerShop = require("@schemas/Shop");
const { EmbedBuilder } = require("discord.js");

module.exports = async function listitems(guildId) {
  const shop = await ServerShop.findOne({ guildId });
  if (!shop || shop.items.length === 0) {
    return new MessageEmbed().setColor("YELLOW").setTitle("🛒 Shop Empty").setDescription("There are no items in the shop.");
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle("🛍️ Server Shop")
    .setDescription("Items available in this server:");

  for (const item of shop.items) {
    embed.addField(item.name, `💰 Price: **${item.price}**${ECONOMY.CURRENCY}`, true);
  }

  return embed;
};
