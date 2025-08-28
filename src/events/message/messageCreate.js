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

  if (message.content.includes(`${client.user.id}`)) {
    sendMessage(message.channel, `Hello and thank you for using ${client.user.username}!

Here is some important information:
• Prefix: \`${settings.prefix}\`

A good command to **get started** is \`${settings.prefix}help\``);
  }

  let isCommand = false;
  if (message.content.startsWith(prefix)) {
    const args = message.content.replace(`${prefix}`, "").split(/\s+/);
    const invoke = args.shift().toLowerCase();
    const cmd = client.getCommand(invoke);

    if (cmd) {
      isCommand = true;
      cmd.executeCommand(message, args, invoke, prefix);
    }
  }

  if (!isCommand) {
    await automodHandler.performAutomod(message, settings);
    if (settings.ranking.enabled) xpHandler.handleXp(message);
  }
};
