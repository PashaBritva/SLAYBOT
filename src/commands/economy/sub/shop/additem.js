const { ECONOMY } = require("@root/config");
const ServerShop = require("@schemas/Shop");
const TemporaryRoles = require("@schemas/TemporaryRoles");
const { MessageEmbed } = require("discord.js");

module.exports = async function additem(guildId, name, price, roleId = null, duration = null) {
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
    ...(roleId && { roleId }),
    ...(duration && { duration })
  };

  shop.items.push(item);
  await shop.save();

  let typeDescription = roleId ? ` (Role: <@&${roleId}>)` : " (Custom item)";
  if (duration) typeDescription += ` - lasts ${duration} hour(s)`;

  return new MessageEmbed()
    .setColor("GREEN")
    .setTitle("🛍️ Item Added")
    .setDescription(`Item **${name}** added for **${price}**${ECONOMY.CURRENCY}${typeDescription}.`);
};
