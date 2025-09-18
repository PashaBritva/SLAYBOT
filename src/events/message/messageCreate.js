const { automodHandler, xpHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");
const { sendMessage } = require("@utils/botUtils");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;

  const settings = await getSettings(message.guild);
  const { prefix } = settings;

  if (message.content.includes(`<@!${client.user.id}>`) || message.content.includes(`<@${client.user.id}>`)) {
    sendMessage(
      message.channel,
      `Hello and thank you for using ${client.user.username}!\n\n` +
      `Here is some important information:\n• Prefix: \`${prefix}\`\n\n` +
      `A good command to **get started** is \`${prefix}help\``
    );
  }

  let isCommand = false;

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const invoke = args.shift().toLowerCase();
    const cmd = client.getCommand(invoke);

    if (cmd) {
      isCommand = true;
      try {
        await cmd.executeCommand(message, args, invoke, prefix);
      } catch (err) {
        client.logger.error(`Error executing command: ${invoke}`, err);
        sendMessage(message.channel, `❌ Failed to execute command \`${invoke}\``);
      }
    }
  }

  if (!isCommand) {
    await automodHandler.performAutomod(message, settings);
    if (settings.ranking.enabled) await xpHandler.handleXp(message);
  }
};
