const { MessageEmbed } = require("discord.js");
const { getUser } = require("@schemas/User");
const ServerShop = require("@schemas/Shop");
const { ECONOMY, EMBED_COLORS } = require("@root/config");

module.exports = async (self, target, coins, shopId = null) => {
  const amount = Number(coins);
  if (isNaN(amount) || amount <= 0) {
    return {
      embeds: [
        new MessageEmbed()
          .setColor(EMBED_COLORS.BOT_EMBED)
          .setTitle("❌ Error")
          .setDescription("Please enter a valid amount of coins to transfer.")
          .setTimestamp(),
      ],
    };
  }

  const targetId = target?.id ?? target?.user?.id ?? null;
  const targetTag = target?.tag ?? target?.user?.tag ?? target?.username ?? "target";
  const targetIsBot = !!(target?.bot || target?.user?.bot);

  if (!targetId && !shopId) {
    return {
      embeds: [
        new MessageEmbed()
          .setColor(EMBED_COLORS.BOT_EMBED)
          .setTitle("❌ Error")
          .setDescription("Invalid target provided.")
          .setTimestamp(),
      ],
    };
  }

  if (targetIsBot && !shopId) {
    return {
      embeds: [
        new MessageEmbed()
          .setColor(EMBED_COLORS.BOT_EMBED)
          .setTitle("❌ Error")
          .setDescription("You cannot transfer coins to bots!")
          .setTimestamp(),
      ],
    };
  }

  if (targetId && targetId === self.id) {
    return {
      embeds: [
        new MessageEmbed()
          .setColor(EMBED_COLORS.BOT_EMBED)
          .setTitle("❌ Error")
          .setDescription("You cannot transfer coins to yourself!")
          .setTimestamp(),
      ],
    };
  }

  const userDb = await getUser(self.id);
  if ((userDb.bank || 0) < amount) {
    return {
      embeds: [
        new MessageEmbed()
          .setColor(EMBED_COLORS.BOT_EMBED)
          .setTitle("❌ Insufficient Funds")
          .setDescription(
            `Insufficient bank balance! You only have ${userDb.bank || 0}${ECONOMY.CURRENCY} in your bank account.`
          )
          .setTimestamp(),
      ],
    };
  }

  userDb.bank -= amount;

  if (shopId) {
    let shop = await ServerShop.findOne({ guildId: shopId });
    if (!shop) shop = new ServerShop({ guildId: shopId, items: [], bank: 0 });
    shop.bank += amount;

    await userDb.save();
    await shop.save();

    return {
      embeds: [
        new MessageEmbed()
          .setColor(EMBED_COLORS.BOT_EMBED)
          .setTitle("✅ Transfer Successful")
          .setDescription(`You have successfully transferred ${amount}${ECONOMY.CURRENCY} to the server shop.`)
          .setTimestamp(),
      ],
    };
  }

  const targetDb = await getUser(targetId);
  targetDb.bank = (targetDb.bank || 0) + amount;

  await userDb.save();
  await targetDb.save();

  return {
    embeds: [
      new MessageEmbed()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setTitle("✅ Transfer Successful")
        .setDescription(`You have successfully transferred ${amount}${ECONOMY.CURRENCY} to ${targetTag}.`)
        .setTimestamp(),
    ],
  };
};
