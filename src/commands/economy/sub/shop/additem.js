const { ECONOMY } = require("@root/config");
const ServerShop = require("@schemas/Shop");
const { MessageEmbed } = require("discord.js");
const { client } = require("@root")

module.exports = async function additem(guildId, name, price, roleId = null) {
  let shop = await ServerShop.findOne({ guildId });
  if (!shop) {
    shop = new ServerShop({ guildId, items: [] });
  }

  const exists = shop.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return new MessageEmbed()
      .setColor("RED")
      .setTitle("❌ Error")
      .setDescription("This item already exists in the shop.");
  }

  const item = {
    name,
    price,
    ...(roleId && { roleId })
  };

  shop.items.push(item);
  await shop.save();

  const typeDescription = roleId ? ` (Role: <@&${roleId}>)` : " (Custom item)";
  
  return new MessageEmbed()
    .setColor("GREEN")
    .setTitle("🛍️ Item Added")
    .setDescription(`Item **${name}** added for **${price}**${ECONOMY.CURRENCY}${typeDescription}.`);
};