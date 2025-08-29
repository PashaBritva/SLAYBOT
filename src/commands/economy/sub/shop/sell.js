const ServerShop = require("@schemas/Shop");
const { MessageEmbed } = require("discord.js");
const { getUser } = require("@schemas/User");
const { ECONOMY } = require("@root/config");
const TemporaryRole = require("@schemas/TemporaryRole");

module.exports = async function sell(guildId, user, name) {
  const shop = await ServerShop.findOne({ guildId });
  if (!shop) return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("Shop not found.");

  const item = shop.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!item) return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("Item not found.");

  const userDoc = await getUser(user.id);
  const inventoryItem = userDoc.inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!inventoryItem) {
    return new MessageEmbed().setColor("RED").setTitle("❌ Error").setDescription("You don't have this item in your inventory.");
  }

  let roleInfo = "";
  if (inventoryItem.roleId) {
    try {
      const guild = await user.client.guilds.fetch(guildId);
      const member = await guild.members.fetch(user.id);
      const role = await guild.roles.fetch(inventoryItem.roleId);

      if (!role) {
        roleInfo = " (Role not found)";
      } else if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        roleInfo = " (Role removed)";
      }

      await TemporaryRole.deleteMany({ userId: user.id, guildId, roleId: inventoryItem.roleId });

    } catch (error) {
      console.error("Error removing role:", error);
      if (error.code === 50013) {
        roleInfo = " (Bot lacks permissions to remove roles)";
      } else {
        roleInfo = " (Failed to remove role)";
      }
    }
  }

  const sellPrice = Math.floor(item.price * 0.8);
  userDoc.coins += sellPrice;
  shop.balance -= sellPrice;

  userDoc.inventory = userDoc.inventory.filter(i => i.name.toLowerCase() !== name.toLowerCase());

  await userDoc.save();
  await shop.save();

  return new MessageEmbed()
    .setColor("GREEN")
    .setTitle("✅ Item Sold")
    .setDescription(`You sold **${item.name}** for **${sellPrice}**${ECONOMY.CURRENCY}.${roleInfo}`);
};
