const { EmbedBuilder } = require("discord.js");
const Auction = require("@schemas/Auction");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config");

module.exports = async (interaction) => {
  const amount = interaction.options.getInteger("amount");
  const auction = await Auction.findOne({ guildId: interaction.guild.id, active: true });
  if (!auction) return interaction.followUp("❌ На сервере нет активного аукциона.");

  const userDb = await getUser(interaction.user.id);
  if (userDb.bank < amount) {
    return interaction.followUp(`⚠ У вас недостаточно ${ECONOMY.CURRENCY} в банке. Баланс: **${userDb.bank}**`);
  }

  if (amount <= auction.highestBid) {
    return interaction.followUp(`⚠ Ставка должна быть выше текущей (**${auction.highestBid}**)`);
  }

  if (auction.highestBidder) {
    const prevUser = await getUser(auction.highestBidder);
    prevUser.coins += auction.highestBid;
    await prevUser.save();
  }

  userDb.coins -= amount;
  await userDb.save();

  auction.highestBid = amount;
  auction.highestBidder = interaction.user.id;
  await auction.save();

  const itemDisplay = auction.type === "role" ? `<@&${auction.item}>` :
    auction.type === "channel" ? `<#${auction.item}>` :
    auction.type === "user" ? `<@${auction.item}>` : auction.item;

  const embed = new EmbedBuilder()
    .setTitle("💰 Новая ставка!")
    .setColor("GREEN")
    .setDescription(
      `> Лот: **${itemDisplay}**\n` +
      `> Текущая ставка: **${amount}**\n` +
      `> **Лидер: <@${interaction.user.id}>**`
    );

  return interaction.followUp({ embeds: [embed] });
};
