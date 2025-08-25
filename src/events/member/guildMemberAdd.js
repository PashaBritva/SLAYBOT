const { inviteHandler, greetingHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').GuildMember} member
 */
module.exports = async (client, member) => {
  if (!member || !member.guild) return;

  const { guild } = member;
  const settings = await getSettings(guild);

  if (Array.isArray(settings.autorole) && settings.autorole.length > 0) {
    const rolesToAdd = settings.autorole
      .map((id) => guild.roles.cache.get(id))
      .filter((role) => role && role.editable);

    if (rolesToAdd.length > 0) {
      try {
        await member.roles.add(rolesToAdd);
      } catch (error) {
        client.logger.error(`Failed to add roles to member ${member.id}:`, error);
      }
    }
  }

  if (settings.counters && settings.counters.length > 0) {
    const hasCounter = settings.counters.find((doc) => 
      doc.counter_type && ["MEMBERS", "BOTS", "USERS"].includes(doc.counter_type.toUpperCase())
    );
    
    if (hasCounter) {
      if (member.user.bot) {
        settings.data.bots += 1;
        await settings.save();
      }
      if (!client.counterUpdateQueue.includes(guild.id)) {
        client.counterUpdateQueue.push(guild.id);
      }
    }
  }

  const inviterData = settings.invite?.tracking ? await inviteHandler.trackJoinedMember(member) : {};

  greetingHandler.sendWelcome(member, inviterData);
};