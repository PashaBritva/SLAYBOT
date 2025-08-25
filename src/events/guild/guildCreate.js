const { MessageEmbed } = require("discord.js");
const { getSettings: registerGuild } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.members.cache.has(guild.ownerId)) await guild.fetchOwner({ cache: true });
  client.logger.log(`Guild Joined: ${guild.name} Members: ${guild.memberCount}`);
  await registerGuild(guild);

  
  const inviteUrl = await createPermanentInvite(client, guild);

  if (!client.joinLeaveWebhook) return;

  const embed = new MessageEmbed()
    .setTitle("Guild Joined")
    .setThumbnail(guild.iconURL())
    .setColor(client.config.EMBED_COLORS.SUCCESS)
    .addField("Name", guild.name, false)
    .addField("ID", guild.id, false)
    .addField("Owner", `${client.users.cache.get(guild.ownerId).tag} [\`${guild.ownerId}\`]`, false)
    .addField("Members", `\`\`\`yaml\n${guild.memberCount}\`\`\``, false)
    .addField("Invite Link", inviteUrl || "Не удалось создать ссылку", true) 
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
    
    let invite = null;
    
    for (const [code, inviteObj] of invites) {
      if (inviteObj.maxUses === 0 || !inviteObj.maxUses) {
        invite = inviteObj;
        break;
      }
    }
    
    if (!invite) {
      const channel = guild.channels.cache
        .filter(c => c.type === 'GUILD_TEXT')
        .first();
      
      if (channel) {
        invite = await channel.createInvite({
          maxAge: 0,
          maxUses: 0,
          unique: true,
          reason: 'Creating permanent invite link'
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