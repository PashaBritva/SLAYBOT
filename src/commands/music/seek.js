const { Command } = require("@src/structures");
const { musicValidations } = require("@utils/botUtils");
const prettyMs = require("pretty-ms");
const { durationToMillis } = require("@utils/miscUtils");

module.exports = class Seek extends Command {
  constructor(client) {
    super(client, {
      name: "seek",
      description: "sets the playing track's position to the specified position",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
        usage: "<duration>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "time",
            description: "The time you want to seek to.",
            type: "STRING",
            required: true,
          },
        ],
      },
    });
  }

  async messageRun(message, args) {
    const time = args.join(" ");
    const response = seekTo(message, time);
    await message.reply(response);
  }

  async interactionRun(interaction) {
    const time = interaction.options.getString("time");
    const response = seekTo(interaction, time);
    await interaction.followUp(response);
  }
};

function seekTo({ client, guildId }, time) {
  const player = client.musicManager?.get(guildId);
  if (!player) return "> ❌ There is no active music player in this server.";
  if (!player.queue?.current) return "> ❌ There is no track currently playing.";

  const seekTo = durationToMillis(time);
  if (isNaN(seekTo)) return "> ❌ Invalid time format. Example: `1m30s` or `90s`.";
  if (seekTo > player.queue.current.duration) {
    return "> ❌ The duration you provided exceeds the length of the current track.";
  }

  player.seek(seekTo);
  return `> ⏩ Seeked to **${prettyMs(seekTo, { colonNotation: true, secondsDecimalDigits: 0 })}**`;
}
