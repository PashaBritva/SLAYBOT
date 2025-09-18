const { EmbedBuilder, ChannelType } = require("discord.js");
const { getSettings: registerGuild } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  // Ensure owner is cached
  if (!guild.members.cache.has(guild.ownerId)) await guild.fetchOwner({ cache: true });

  client.logger.log(`Guild Joined: ${guild.name} | Members: ${guild.memberCount}`);

  // Register guild in DB
  await registerGuild(guild);

  // Create permanent invite
  const inviteUrl = await createPermanentInvite(client, guild);

  if (!client.joinLeaveWebhook) return;

  const owner = client.users.cache.get(guild.ownerId);

  const embed = new EmbedBuilder()
    .setTitle("Guild Joined")
    .setThumbnail(guild.iconURL())
    .setColor(client.config.EMBED_COLORS.SUCCESS)
    .addFields(
      { name: "Name", value: guild.name, inline: false },
      { name: "ID", value: guild.id, inline: false },
      { name: "Owner", value: `${owner ? owner.tag : guild.ownerId} [\`<@${guild.ownerId}>\`]`, inline: false },
      { name: "Members", value: `\`\`\`yaml\n${guild.memberCount}\`\`\``, inline: false },
      { name: "Invite Link", value: inviteUrl || "Не удалось создать ссылку", inline: true }
    )
    .setFooter({ text: `Guild #${client.guilds.cache.size}` });

  client.joinLeaveWebhook.send({
    username: "Join",
    avatarURL: client.user.displayAvatarURL(),
    embeds: [embed],
  });
};

/**
 * Creating permanent invite link
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
async function createPermanentInvite(client, guild) {
  try {
    const invites = await guild.invites.fetch();
    
    let invite = invites.find(i => !i.maxUses || i.maxUses === 0);

    if (!invite) {
      const channel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me).has("CreateInstantInvite"));
      if (channel) {
        invite = await channel.createInvite({
          maxAge: 0,
          maxUses: 0,
          unique: true,
          reason: 'Creating permanent invite link',
        });
        client.logger.log(`Created permanent invite for ${guild.name}: ${invite.url}`);
      }
    }

    const guildSettings = await registerGuild(guild);
    if (invite && guildSettings) {
      guildSettings.inviteUrl = invite.url;
      await guildSettings.save();
      client.logger.log(`Saved invite URL for ${guild.name}`);
      return invite.url;
    }

    return invite?.url || null;

  } catch (error) {
    client.logger.error(`Error creating permanent invite for ${guild.name}:`, error);
    return null;
  }
}
