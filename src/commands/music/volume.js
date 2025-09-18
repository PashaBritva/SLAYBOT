const { Command } = require("@src/structures");
const { Message, CommandInteraction, ApplicationCommandOptionType } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Volume extends Command {
  constructor(client) {
    super(client, {
      name: "volume",
      description: "set the music player volume",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
        usage: "<1-100>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "amount",
            description: "Enter a value to set [1 to 100]",
            type: ApplicationCommandOptionType.Integer,
            required: false,
          },
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const amount = parseInt(args[0], 10);
    const response = await setVolume(message, amount);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const amount = interaction.options.getInteger("amount");
    const response = await setVolume(interaction, amount);
    await interaction.followUp(response);
  }
};

async function setVolume({ client, guildId }, amount) {
  const player = client.musicManager.get(guildId);

  if (!player) return "> ❌ No active music player for this server.";

  if (!amount) return `> 🔊 The player volume is currently \`${player.volume}\`.`;

  if (amount < 1 || amount > 100) {
    return "> ❌ You need to give me a volume between **1** and **100**.";
  }

  player.setVolume(amount);
  return `> 🎶 Music player volume has been set to \`${amount}\`.`;
}
