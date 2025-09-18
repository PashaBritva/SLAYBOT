const ServerShop = require("@schemas/Shop");
const { EmbedBuilder } = require("discord.js");
const transfer = require("../transfer");
const { getUser } = require("@schemas/User");
const { ECONOMY } = require("@root/config");
const TemporaryRole = require("@schemas/TemporaryRoles");
const { error } = require("@src/helpers/logger");

module.exports = async function buy(guildId, user, name) {
  const shop = await ServerShop.findOne({ guildId });
  if (!shop) return new MessageEmbed()
    .setColor("RED")
    .setTitle("❌ Error")
    .setDescription("Shop not found.");

  const item = shop.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!item) return new MessageEmbed()
    .setColor("RED")
    .setTitle("❌ Error")
    .setDescription("Item not found.");

  const result = await transfer(user, null, item.price, guildId);
  if (result.embeds?.[0]?.title?.startsWith("❌")) {
    return new MessageEmbed()
      .setColor("RED")
      .setTitle("❌ Error")
      .setDescription("Please top up your bank account for payment.");
  }

  shop.balance = (shop.balance || 0) + item.price;
  await shop.save();

  const userDoc = await getUser(user.id);

  userDoc.inventory.push({
    name: item.name,
    type: item.roleId ? "role" : "custom",
    ...(item.roleId && { roleId: item.roleId }),
    ...(item.duration && { duration: item.duration })
  });

  let roleInfo = "";
  if (item.roleId) {
    try {
      const guild = await user.client.guilds.fetch(guildId);
      const member = await guild.members.fetch(user.id);
      const role = await guild.roles.fetch(item.roleId);

      if (role) {
        await member.roles.add(role);

        if (item.duration) {
          const expiresAt = new Date(Date.now() + item.duration * 60 * 1000);
          await TemporaryRole.create({
            userId: user.id,
            guildId,
            roleId: item.roleId,
            expiresAt
          });
          roleInfo = ` (Role granted for ${item.duration} minute(s)!)`;
        } else {
          roleInfo = " (Role granted!)";
        }


      } else {
        roleInfo = " (Role not found - contact admin)";
      }
    } catch (err) {
      error("Error giving role:", err);
      roleInfo = " (Failed to give role - contact admin)";
    }
  }

  await userDoc.save();

  return new MessageEmbed()
    .setColor("GREEN")
    .setTitle("✅ Purchase Successful")
    .setDescription(`You bought **${item.name}** for **${item.price}**${ECONOMY.CURRENCY}.${roleInfo}`);
};
