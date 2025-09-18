const { Command } = require("@src/structures");
const { EmbedBuilder, ApplicationCommandOptionType, Message, CommandInteraction } = require("discord.js");
const { MESSAGES } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");
const outdent = require("outdent");

module.exports = class GithubCommand extends Command {
  constructor(client) {
    super(client, {
      name: "github",
      description: "shows github statistics of a user",
      cooldown: 10,
      category: "UTILITY",
      botPermissions: ["EmbedLinks"],
      command: {
        enabled: true,
        aliases: ["git"],
        usage: "<username>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "username",
            description: "github username",
            type: ApplicationCommandOptionType.String,
            required: true,
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
    const username = args.join(" ");
    const response = await getGithubUser(username, message.author);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const username = interaction.options.getString("username");
    const response = await getGithubUser(username, interaction.user);
    await interaction.followUp(response);
  }
};

function websiteProvided(text) {
  if (!text) return false;
  return text.startsWith("http://") || text.startsWith("https://");
}

async function getGithubUser(target, author) {
  const response = await getJson(`https://api.github.com/users/${target}`);
  if (response.status === 404) return "```No user found with that name```";
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data;
  const {
    login: username,
    name,
    id: githubId,
    avatar_url: avatarUrl,
    html_url: userPageLink,
    followers,
    following,
    bio,
    location,
    blog,
  } = json;

  let website = websiteProvided(blog) ? `[Click me](${blog})` : "Not Provided";

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `GitHub User: ${username}`,
      url: userPageLink,
      iconURL: avatarUrl,
    })
    .addFields([
      {
        name: "User Info",
        value: outdent`
          **Real Name**: *${name || "Not Provided"}*
          **Location**: *${location || "Not Provided"}*
          **GitHub ID**: *${githubId}*
          **Website**: *${website}*
        `,
        inline: true,
      },
      {
        name: "Social Stats",
        value: `**Followers**: *${followers}*\n**Following**: *${following}*`,
        inline: true,
      },
    ])
    .setDescription(`**Bio**:\n${bio || "Not Provided"}`)
    .setImage(avatarUrl)
    .setColor(0x6e5494)
    .setFooter({ text: `Requested by ${author.tag}` });

  return { embeds: [embed] };
}
