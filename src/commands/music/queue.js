const { EMBED_COLORS } = require("@root/config");
const { Command } = require("@src/structures");
const { EmbedBuilder } = require("discord.js");

module.exports = class Queue extends Command {
  constructor(client) {
    super(client, {
      name: "queue",
      description: "displays the current music queue",
      category: "MUSIC",
      botPermissions: ["EMBED_LINKS"],
      command: { enabled: true, usage: "[page]" },
      slashCommand: {
        enabled: true,
        options: [
          { name: "page", description: "page number", type: "INTEGER", required: false },
        ],
      },
    });
  }

  async messageRun(message, args) {
    const page = args.length && Number(args[0]) ? Number(args[0]) : 1;
    await message.reply(getQueue(message, page));
  }

  async interactionRun(interaction) {
    const page = interaction.options.getInteger("page") || 1;
    await interaction.followUp(getQueue(interaction, page));
  }
};

function getQueue({ client, guild }, pgNo = 1) {
  const player = client.musicManager.get(guild.id);
  if (!player) return "> 🚫 There is no music playing in this guild.";

  const queue = player.queue;
  const multiple = 10;
  const page = pgNo;
  const start = (page - 1) * multiple;
  const end = start + multiple;

  const tracks = queue.slice(start, end);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: `Queue for ${guild.name}` });

  if (queue.current) {
    embed.addFields({ name: "Current", value: `[${queue.current.title}](${queue.current.uri})` });
  }

  if (!tracks.length) {
    embed.setDescription(`No tracks in ${page > 1 ? `page ${page}` : "the queue"}.`);
  } else {
    embed.setDescription(tracks.map((track, i) => `${start + i + 1} - [${track.title}](${track.uri})`).join("\n"));
  }

  const maxPages = Math.ceil(queue.length / multiple);
  embed.setFooter({ text: `Page ${page > maxPages ? maxPages : page} of ${maxPages}` });

  return { embeds: [embed] };
}
