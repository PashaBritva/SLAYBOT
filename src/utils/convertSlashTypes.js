const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

function convertOptions(options) {
  if (!Array.isArray(options)) return options;

  return options.map(opt => {
    const newOpt = { ...opt };

    if (typeof newOpt.type === "string" && ApplicationCommandOptionType[newOpt.type]) {
      newOpt.type = ApplicationCommandOptionType[newOpt.type];
    }

    if (Array.isArray(newOpt.channel_types)) {
      newOpt.channel_types = newOpt.channel_types.map(ch => {
        return typeof ch === "string" && ChannelType[ch] !== undefined ? ChannelType[ch] : ch;
      });
    }

    if (Array.isArray(newOpt.options)) {
      newOpt.options = convertOptions(newOpt.options);
    }

    return newOpt;
  });
}

function convertSlashCommands(commands) {
  for (const cmd of commands.values()) {
    if (cmd.slashCommand?.options && Array.isArray(cmd.slashCommand.options)) {
      cmd.slashCommand.options = convertOptions(cmd.slashCommand.options);
    }
  }
}

module.exports = {
  convertSlashCommands,
  convertOptions
};