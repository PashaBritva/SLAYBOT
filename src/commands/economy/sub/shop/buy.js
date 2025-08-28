const ServerShop = require("@schemas/Shop");
const { MessageEmbed } = require("discord.js");
const transfer = require("../transfer");
const { getUser } = require("@schemas/User");
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

  shop.balance = (shop.balance || 0) + item.price;
  console.log(shop.balance)
  await shop.save();

  const userDoc = await getUser(user.id);

  userDoc.inventory.push({
    name: item.name,
    type: item.roleId ? "role" : "custom",
    ...(item.roleId && { roleId: item.roleId })
  });

  let roleInfo = "";
  if (item.roleId) {
    try {
      const guild = await user.client.guilds.fetch(guildId);
      const member = await guild.members.fetch(user.id);
      const role = await guild.roles.fetch(item.roleId);
      
      if (role) {
        await member.roles.add(role);
        roleInfo = " (Role granted!)";
      } else {
        roleInfo = " (Role not found - contact admin)";
      }
    } catch (error) {
      console.error("Error giving role:", error);
      roleInfo = " (Failed to give role - contact admin)";
    }
  }

  await userDoc.save();

  return new MessageEmbed()
    .setColor("GREEN")
    .setTitle("✅ Purchase Successful")
    .setDescription(`You bought **${item.name}** for **${item.price}**${ECONOMY.CURRENCY}.${roleInfo}`);
};