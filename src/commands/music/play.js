const { Command } = require("@src/structures");
const { EmbedBuilder } = require("discord.js");
const prettyMs = require("pretty-ms");
const { EMBED_COLORS } = require("@root/config");

module.exports = class Play extends Command {
  constructor(client) {
    super(client, {
      name: "play",
      description: "play a song from youtube",
      category: "MUSIC",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<song-name>",
        minArgsCount: 1,
        aliases: ["p"],
      },
      slashCommand: {
        enabled: true,
        options: [
          { name: "query", description: "song name or url", type: "STRING", required: true },
        ],
      },
    });
  }

  async messageRun(message, args) {
    const query = args.join(" ");
    const response = await play(message, message.author, query);
    await message.reply(response);
  }

  async interactionRun(interaction) {
    const query = interaction.options.getString("query");
    const response = await play(interaction, interaction.user, query);
    await interaction.followUp(response);
  }
};

async function play({ member, guild, channel }, user, query) {
  if (!member.voice.channel) return "> 🚫 You need to join a voice channel first";

  let player = guild.client.musicManager.get(guild.id);

  if (player && member.voice.channel.id !== guild.me.voice.channel?.id) {
    return "> 🚫 You must be in the same voice channel as mine";
  }

  if (!player) {
    player = guild.client.musicManager.create({
      guild: guild.id,
      textChannel: channel.id,
      voiceChannel: member.voice.channel.id,
      volume: 50,
    });
  }

  if (player.state !== "CONNECTED") player.connect();

  let res;
  try {
    res = await player.search(query, user);
    if (res.loadType === "LOAD_FAILED") {
      if (!player.queue.current) player.destroy();
      throw res.exception;
    }
  } catch (err) {
    guild.client.logger.error("Search Exception", err);
    return "There was an error while searching";
  }

  const embed = new EmbedBuilder().setColor(EMBED_COLORS.BOT_EMBED);
  let track;

  switch (res.loadType) {
    case "NO_MATCHES":
      if (!player.queue.current) player.destroy();
      return `No results found matching ${query}`;

    case "TRACK_LOADED":
    case "SEARCH_RESULT":
      track = res.tracks[0];
      player.queue.add(track);
      if (!player.playing && !player.paused && !player.queue.size) player.play();

      embed
        .setAuthor({ name: "Added Song to queue" })
        .setDescription(`[${track.title}](${track.uri})`)
        .addFields(
          { name: "Requested By", value: `${track.requester.tag}`, inline: true },
          { name: "Duration", value: `\`${prettyMs(track.duration, { colonNotation: true })}\``, inline: true },
          { name: "Position in Queue", value: `${player.queue.size}`, inline: true }
        );

      if (typeof track.displayThumbnail === "function") embed.setThumbnail(track.displayThumbnail("hqdefault"));
      return { embeds: [embed] };

    case "PLAYLIST_LOADED":
      player.queue.add(res.tracks);
      if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play();

      embed
        .setAuthor({ name: "Added Playlist to queue" })
        .setDescription(res.playlist.name)
        .addFields(
          { name: "Enqueued", value: `${res.tracks.length} songs`, inline: true },
          { name: "Playlist duration", value: `\`${prettyMs(res.playlist.duration, { colonNotation: true })}\``, inline: true },
          { name: "Requested By", value: `${res.tracks[0].requester.tag}`, inline: true }
        );

      return { embeds: [embed] };
  }
}
