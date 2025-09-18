const { Command } = require("@src/structures");
const { musicValidations } = require("@utils/botUtils");

const levels = {
  none: 0.0,
  low: 0.1,
  medium: 0.15,
  high: 0.25,
};

module.exports = class Bassboost extends Command {
  constructor(client) {
    super(client, {
      name: "bassboost",
      description: "set bassboost level",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
        minArgsCount: 1,
        usage: "<none|low|medium|high>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "level",
            description: "bassboost level",
            type: "STRING",
            required: true,
            choices: Object.keys(levels).map((lvl) => ({ name: lvl, value: lvl })),
          },
        ],
      },
    });
  }

  async messageRun(message, args) {
    const level = args[0]?.toLowerCase() in levels ? args[0].toLowerCase() : "none";
    const response = setBassBoost(message, level);
    await message.reply(response);
  }

  async interactionRun(interaction) {
    const level = interaction.options.getString("level");
    const response = setBassBoost(interaction, level);
    await interaction.followUp(response);
  }
};

function setBassBoost({ client, guildId }, level) {
  const player = client.musicManager.get(guildId);
  if (!player) return "> 🚫 No music is currently playing!";

  const bands = Array.from({ length: 3 }, (_, i) => ({ band: i, gain: levels[level] }));
  player.setEQ(...bands);
  return `> 🎛️ Set bassboost level to **${level}**`;
}
