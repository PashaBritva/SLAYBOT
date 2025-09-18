const { Command } = require("@src/structures");
const { Message, CommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const prettyMs = require("pretty-ms");
const { EMBED_COLORS } = require("@root/config");

module.exports = class Search extends Command {
  constructor(client) {
    super(client, {
      name: "search",
      description: "search for matching songs on YouTube",
      category: "MUSIC",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<song-name>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "query",
            description: "song to search",
            type: "STRING",
            required: true,
          },
        ],
      },
    });
  }

  async messageRun(message, args) {
    const query = args.join(" ");
    const response = await search(message, message.author, query);
    if (response) await message.reply(response);
  }

  async interactionRun(interaction) {
    const query = interaction.options.getString("query");
    const response = await search(interaction, interaction.user, query);
    if (response) await interaction.followUp(response);
    else interaction.deleteReply();
  }
};

async function search({ member, guild, channel }, user, query) {
  if (!member.voice.channel) return "🚫 You need to join a voice channel first";

  let player = guild.client.musicManager.get(guild.id);
  if (player && member.voice.channel.id !== guild.members.me.voice.channel?.id) {
    return "🚫 You must be in the same voice channel as mine";
  }

  try {
    if (!player) {
      player = guild.client.musicManager.create({
        guild: guild.id,
        textChannel: channel.id,
        voiceChannel: member.voice.channel.id,
        volume: 50,
      });
    }

    if (player.state !== "CONNECTED") player.connect();
  } catch (ex) {
    if (ex.message === "No available nodes.") {
      guild.client.logger.debug("No available nodes!");
      return "🚫 No available nodes! Try again later";
    }
  }

  let res;
  try {
    res = await player.search(query, user);
    if (res.loadType === "LOAD_FAILED") {
      if (!player.queue.current) player.destroy();
      throw new Error(res.exception?.message || "Unknown search error");
    }
  } catch (err) {
    guild.client.logger.error("Search Exception", err);
    return "There was an error while searching";
  }

  const embed = new EmbedBuilder().setColor(EMBED_COLORS.BOT_EMBED);

  switch (res.loadType) {
    case "NO_MATCHES":
      if (!player.queue.current) player.destroy();
      return `No results found matching **${query}**`;

    case "TRACK_LOADED": {
      const track = res.tracks[0];
      player.queue.add(track);

      if (!player.playing && !player.paused && !player.queue.size) player.play();

      embed
        .setThumbnail(track.displayThumbnail("hqdefault"))
        .setAuthor({ name: "Added Song to queue" })
        .setDescription(`[${track.title}](${track.uri})`)
        .addFields(
          { name: "Song Duration", value: `\`${prettyMs(track.duration, { colonNotation: true })}\``, inline: true },
          { name: "Position in Queue", value: `${player.queue.size}`, inline: true }
        )
        .setFooter({ text: `Requested By: ${track.requester.tag}` });

      return { embeds: [embed] };
    }

    case "PLAYLIST_LOADED": {
      player.queue.add(res.tracks);
      if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play();

      embed
        .setAuthor({ name: "Added Playlist to queue" })
        .setDescription(res.playlist.name)
        .addFields(
          { name: "Enqueued", value: `${res.tracks.length} songs`, inline: true },
          { name: "Playlist duration", value: `\`${prettyMs(res.playlist.duration, { colonNotation: true })}\``, inline: true }
        )
        .setFooter({ text: `Requested By: ${res.tracks[0].requester.tag}` });

      return { embeds: [embed] };
    }

    case "SEARCH_RESULT": {
      const max = Math.min(res.tracks.length, guild.client.config.MUSIC.MAX_SEARCH_RESULTS);
      const results = res.tracks.slice(0, max);

      const options = results.map((track, i) => ({
        label: track.title.slice(0, 100),
        value: i.toString(),
      }));

      const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("search-results")
          .setPlaceholder("Choose a song to add to queue")
          .setMaxValues(1)
          .addOptions(options)
      );

      embed.setAuthor({ name: "Search Results" }).setDescription("Please select the song you wish to add to queue");

      const sentMsg = await channel.send({ embeds: [embed], components: [menuRow] });

      const collector = channel.createMessageComponentCollector({
        filter: (i) => i.user.id === user.id,
        idle: 30_000,
        dispose: true,
      });

      collector.on("collect", async (i) => {
        const track = results[parseInt(i.values[0])];
        player.queue.add(track);

        if (!player.playing && !player.paused && player.queue.size === 1) player.play();

        embed
          .setThumbnail(track.displayThumbnail("hqdefault"))
          .setAuthor({ name: "Added Song to queue" })
          .setDescription(`[${track.title}](${track.uri})`)
          .addFields(
            { name: "Song Duration", value: `\`${prettyMs(track.duration, { colonNotation: true })}\``, inline: true },
            { name: "Position in Queue", value: `${player.queue.size}`, inline: true }
          )
          .setFooter({ text: `Requested By: ${track.requester.tag}` });

        await i.update({ embeds: [embed], components: [] });
      });

      collector.on("end", () => sentMsg.edit({ components: [] }));
      return null;
    }
  }
}
