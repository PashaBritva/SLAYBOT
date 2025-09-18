const { EmbedBuilder } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  client.logger.log(`Guild Left: ${guild.name} | Members: ${guild.memberCount}`);

  const settings = await getSettings(guild);
  settings.data.leftAt = new Date();
  await settings.save();

  if (!client.joinLeaveWebhook) return;

  let ownerTag = guild.ownerId;
  try {
    const owner = await client.users.fetch(guild.ownerId);
    ownerTag = `${owner.tag} [\`${owner.id}\`]`;
  } catch {
    ownerTag = `${guild.ownerId}`;
  }

  let inviteUrl = settings.inviteUrl || null;
  if (!inviteUrl) {
    try {
      const textChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me).has("CreateInstantInvite"));
      if (textChannel) {
        const invite = await textChannel.createInvite({ maxAge: 0, maxUses: 0, unique: true, reason: "Permanent invite for logs" });
        inviteUrl = invite.url;
      }
    } catch (err) {
      client.logger.error(`Failed to create invite for ${guild.name}:`, err);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle("Guild Left")
    .setThumbnail(guild.iconURL())
    .setColor(client.config.EMBED_COLORS.ERROR)
    .addFields(
      { name: "Name", value: guild.name, inline: false },
      { name: "ID", value: guild.id, inline: false },
      { name: "Owner", value: ownerTag, inline: false },
      { name: "Members", value: `\`\`\`yaml\n${guild.memberCount}\`\`\``, inline: false },
      { name: "Invite Link", value: inviteUrl || "Не удалось создать ссылку", inline: true }
    )
    .setFooter({ text: `Guild #${client.guilds.cache.size}` });

  client.joinLeaveWebhook.send({
    username: "Leave",
    avatarURL: client.user.displayAvatarURL(),
    embeds: [embed],
  });
};
