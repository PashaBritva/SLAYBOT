const { EMBED_COLORS } = require("@root/config");

/**
 * @param {import('discord.js').GuildMember} member
 */
module.exports = async (member) => {
  // Permissions
  if (!member.permissions.has("MANAGE_MESSAGES")) {
    return "You need to have the manage messages permissions to manage giveaways.";
  }

  // Search with all giveaways
  const giveaways = member.client.giveawaysManager.giveaways.filter(
    (g) => g.guildId === member.guild.id && g.ended === false
  );

  // No giveaways
  if (giveaways.length === 0) {
    return "There are no giveaways running in this server.";
  }

  let description = "";
  for (let i = 0; i < giveaways.length; i++) {
    const line = `${i + 1}. ${giveaways[i].prize} in <#${giveaways[i].channelId}>\n`;
    if (description.length + line.length > 2048) break;
    description += line;
  }

  if (description.length === 0) {
    description = "Too many giveaways to display.";
  }

  try {
    return { embeds: [{ description, color: EMBED_COLORS.GIVEAWAYS }] };
  } catch (error) {
    member.client.logger.error("Giveaway List", error);
    return `An error occurred while listing the giveaways: ${error.message}`;
  }
};
