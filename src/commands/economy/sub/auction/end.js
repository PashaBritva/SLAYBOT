const { MessageEmbed } = require("discord.js");
const Auction = require("@schemas/Auction");

module.exports = async (interaction, auto = false) => {
  const auction = await Auction.findOne({ guildId: interaction.guild.id, active: true });
  if (!auction) return interaction.followUp("❌ Нет активного аукциона.");

  if (!auto && auction.ownerId !== interaction.user.id)
    return interaction.followUp("⚠ Только создатель аукциона может завершить аукцион.");

  auction.active = false;
  await auction.save();

  const itemDisplay = auction.type === "role" ? `<@&${auction.item}>` :
    auction.type === "channel" ? `<#${auction.item}>` :
    auction.type === "user" ? `<@${auction.item}>` : auction.item;

  let result;
  if (auction.highestBidder) {
    result = `🏆 Победитель: <@${auction.highestBidder}> за **${auction.highestBid}**`;
    try {
      if (auction.type === "role") {
        const member = await interaction.guild.members.fetch(auction.highestBidder);
        await member.roles.add(auction.item);
      } else if (auction.type === "channel") {
        const channel = await interaction.guild.channels.fetch(auction.item);
        await channel.permissionOverwrites.edit(auction.highestBidder, { VIEW_CHANNEL: true });
      }
    } catch (e) {
      console.error("Auction reward error:", e);
    }
  } else {
    result = "❌ Никто не сделал ставку.";
  }

  const embed = new MessageEmbed()
    .setTitle("⏹ Аукцион завершён")
    .setColor("RED")
    .setDescription(`> Лот: **${itemDisplay}**\n${result}`);

  return interaction.followUp({ embeds: [embed] });
};
