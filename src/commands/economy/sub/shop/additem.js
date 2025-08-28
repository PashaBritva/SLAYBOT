const { ECONOMY } = require("@root/config");
const ServerShop = require("@schemas/Shop");
const { MessageEmbed } = require("discord.js");

module.exports = async function additem(guildId, name, price) {
  let shop = await ServerShop.findOne({ guildId });
  if (!shop) {
    shop = new ServerShop({ guildId, items: [] });
  }

  const exists = shop.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("This item already exists in the shop.");
  }

  shop.items.push({ name, price });
  await shop.save();

  return new MessageEmbed().setColor("GREEN").setTitle("🛍️ Item Added").setDescription(`Item **${name}** added for **${price}**${ECONOMY.CURRENCY}.`);
};
