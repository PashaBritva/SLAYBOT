const { Command } = require("@src/structures");
const { resolveMember } = require("@utils/guildUtils");
const { getUser } = require("@schemas/User");
const { EmbedBuilder, ApplicationCommandOptionType, Message, CommandInteraction } = require("discord.js");
const { diffHours, getRemainingTime } = require("@utils/miscUtils");
const { EMBED_COLORS } = require("@root/config");

module.exports = class Reputation extends Command {
  constructor(client) {
    super(client, {
      name: "rep",
      description: "give reputation to a user",
      category: "SOCIAL",
      botPermissions: ["EmbedLinks"],
      command: {
        enabled: true,
        minArgsCount: 1,
        aliases: ["reputation"],
        subcommands: [
          {
            trigger: "view [user]",
            description: "view reputation for a user",
          },
          {
            trigger: "give [user]",
            description: "give reputation to a user",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "view",
            description: "view reputation for a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "user",
                description: "the user to check reputation for",
                type: ApplicationCommandOptionType.User,
                required: false,
              },
            ],
          },
          {
            name: "give",
            description: "give reputation to a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "user",
                description: "the user to give reputation to",
                type: ApplicationCommandOptionType.User,
                required: true,
              },
            ],
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
    const sub = args[0];
    let response;

    if (sub === "view") {
      let target = message.author;
      if (args[1]) {
        const resolved = (await resolveMember(message, args[1])) || message.member;
        if (resolved) target = resolved.user;
      }
      response = await viewReputation(target);
    }

    else if (sub === "give") {
      const target = await resolveMember(message, args[1]);
      if (!target) return message.reply("Please provide a valid user to give reputation to");
      response = await giveReputation(message.author, target.user);
    }

    else {
      response = "Incorrect command usage";
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    if (sub === "view") {
      const target = interaction.options.getUser("user") || interaction.user;
      response = await viewReputation(target);
    }

    if (sub === "give") {
      const target = interaction.options.getUser("user");
      response = await giveReputation(interaction.user, target);
    }

    await interaction.followUp(response);
  }
};

async function viewReputation(target) {
  const userData = await getUser(target.id);
  if (!userData) return `${target.tag} has no reputation yet`;

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Reputation for ${target.username}` })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      { name: "Given", value: userData.reputation?.given.toString() || "0", inline: true },
      { name: "Received", value: userData.reputation?.received.toString() || "0", inline: true }
    );

  return { embeds: [embed] };
}

async function giveReputation(user, target) {
  if (target.bot) return "You cannot give reputation to bots";
  if (target.id === user.id) return "You cannot give reputation to yourself";

  const userData = await getUser(user.id);
  if (userData && userData.reputation.timestamp) {
    const lastRep = new Date(userData.reputation.timestamp);
    const diff = diffHours(new Date(), lastRep);
    if (diff < 24) {
      const nextUsage = lastRep.setHours(lastRep.getHours() + 24);
      return `You can again run this command in \`${getRemainingTime(nextUsage)}\``;
    }
  }

  const targetData = await getUser(target.id);

  userData.reputation.given += 1;
  userData.reputation.timestamp = new Date();
  targetData.reputation.received += 1;

  await userData.save();
  await targetData.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`${target.toString()} +1 Rep!`)
    .setFooter({ text: `By ${user.tag}` })
    .setTimestamp();

  return { embeds: [embed] };
}
