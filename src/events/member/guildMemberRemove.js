const { inviteHandler, greetingHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').GuildMember|import('discord.js').PartialGuildMember} member
 */
module.exports = async (client, member) => {
  if (member.partial) await member.fetch();
  if (!member.guild) return;

  const { guild } = member;
  const settings = await getSettings(guild);

  const hasCounter = settings.counters?.some((doc) =>
    ["MEMBERS", "BOTS", "USERS"].includes(doc.counter_type?.toUpperCase())
  );

  if (hasCounter) {
    if (member.user.bot) {
      settings.data.bots = (settings.data.bots || 1) - 1;
      await settings.save();
    }
    if (!client.counterUpdateQueue.includes(guild.id)) {
      client.counterUpdateQueue.push(guild.id);
    }
  }

  const inviterData = settings.invite?.tracking
    ? await inviteHandler.trackLeftMember(guild, member.user)
    : {};

  greetingHandler.sendFarewell(member, inviterData);
};
