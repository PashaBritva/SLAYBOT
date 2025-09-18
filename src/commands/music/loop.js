const { Command } = require("@src/structures");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Loop extends Command {
  constructor(client) {
    super(client, {
      name: "loop",
      description: "loops the current song or the entire queue",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
        minArgsCount: 1,
        usage: "<queue|track>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "type",
            type: "STRING",
            description: "Select what you want to loop",
            required: false,
            choices: [
              { name: "Track", value: "track" },
              { name: "Queue", value: "queue" },
            ],
          },
        ],
      },
    });
  }

  async messageRun(message, args) {
    const type = args[0]?.toLowerCase() === "queue" ? "queue" : "track";
    const response = toggleLoop(message, type);
    await message.reply(response);
  }

  async interactionRun(interaction) {
    const type = interaction.options.getString("type") || "track";
    const response = toggleLoop(interaction, type);
    await interaction.followUp(response);
  }
};

function toggleLoop({ client, guildId }, type) {
  const player = client.musicManager.get(guildId);
  if (!player) return "> 🚫 No music is currently playing!";

  if (type === "track") {
    player.setTrackRepeat(!player.trackRepeat);
    return `> 🔁 Track loop is now **${player.trackRepeat ? "enabled" : "disabled"}**`;
  } else if (type === "queue") {
    player.setQueueRepeat(!player.queueRepeat);
    return `> 🔂 Queue loop is now **${player.queueRepeat ? "enabled" : "disabled"}**`;
  }

  return "> ❌ Invalid loop type. Use `track` or `queue`.";
}
