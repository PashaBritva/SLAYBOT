const { EMBED_COLORS } = require("@root/config");
const { Command } = require("@src/structures");
const { EmbedBuilder } = require("discord.js");
const prettyMs = require("pretty-ms");
const { splitBar } = require("string-progressbar");

module.exports = class NowPlaying extends Command {
  constructor(client) {
    super(client, {
      name: "np",
      description: "shows the track currently being played",
      category: "MUSIC",
      botPermissions: ["EMBED_LINKS"],
      command: { enabled: true, aliases: ["nowplaying"] },
      slashCommand: { enabled: true },
    });
  }

  async messageRun(message) {
    await message.reply(getNowPlaying(message));
  }

  async interactionRun(interaction) {
    await interaction.followUp(getNowPlaying(interaction));
  }
};

function getNowPlaying({ client, guildId }) {
  const player = client.musicManager.get(guildId);
  if (!player || !player.queue.current) return "> 🚫 No music is being played!";

  const track = player.queue.current;
  const duration = track.duration > 6.048e8 ? "🔴 LIVE" : prettyMs(track.duration, { colonNotation: true });
  const position = prettyMs(player.position, { colonNotation: true });

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: "Now Playing ♪", iconURL: client.user.displayAvatarURL() })
    .addFields(
      { name: "🎵 Track", value: `[${track.title}](${track.uri})` },
      {
        name: "⏱️ Position",
        value: `${position} [${splitBar(track.duration > 6.048e8 ? player.position : track.duration, player.position, 15)[0]}] ${duration}`,
      },
      { name: "📄 Position in Queue", value: (player.queue.size - 0).toString(), inline: true },
      { name: "⏳ Song Duration", value: `\`${duration}\``, inline: true },
      { name: "🙋 Added By", value: track.requester?.tag || "NA", inline: true }
    );

  if (typeof track.displayThumbnail === "function") embed.setThumbnail(track.displayThumbnail("hqdefault"));

  return { embeds: [embed] };
}
