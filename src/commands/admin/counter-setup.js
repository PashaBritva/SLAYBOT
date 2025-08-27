const { Message, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { getMemberStats } = require("@utils/guildUtils");
const { getSettings } = require("@schemas/Guild");

module.exports = class CounterSetup extends Command {
  constructor(client) {
    super(client, {
      name: "counter",
      description: "setup counter channel in the guild",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      botPermissions: ["MANAGE_CHANNELS"],
      command: {
        enabled: true,
        usage: "<type> <channel-name>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "type",
            description: "type of counter channel",
            type: "STRING",
            required: true,
            choices: [
              {
                name: "users",
                value: "USERS",
              },
              {
                name: "members",
                value: "MEMBERS",
              },
              {
                name: "bots",
                value: "BOTS",
              },
              {
                name: "role",
                value: "ROLE",
              },
            ],
          },
          {
            name: "name",
            description: "name of the counter channel",
            type: "STRING",
            required: true,
          },
          {
            name: "role",
            description: "role to count members for (only for 'role' type)",
            type: "ROLE",
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
    const type = args[0].toUpperCase();
    if (!type || !["USERS", "MEMBERS", "BOTS", "ROLE"].includes(type)) {
      return message.reply("Incorrect arguments are passed! Counter types: `users/members/bots/role`");
    }
    if (args.length < 2) return message.reply("Incorrect Usage! You did not provide name");
    
    let role;
    if (type === "ROLE") {
      role = message.mentions.roles.first();
      if (!role) return message.reply("You need to mention a role for the 'role' counter type.");
    }

    args.shift();
    let channelName = args.join(" ");

    const response = await setupCounter(message.guild, type, channelName, role);
    return message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const type = interaction.options.getString("type");
    const name = interaction.options.getString("name");
    const role = interaction.options.getRole("role");

    if (type === "ROLE" && !role) {
      return interaction.followUp("You need to specify a role for the 'role' counter type.");
    }

    const response = await setupCounter(interaction.guild, type.toUpperCase(), name, role);
    return interaction.followUp(response);
  }
};

async function setupCounter(guild, type, name, role) {
  let channelName = name;

  const stats = await getMemberStats(guild);

  let initialCount = 0;
  if (type === "USERS") initialCount = stats[0];
  else if (type === "MEMBERS") initialCount = stats[2];
  else if (type === "BOTS") initialCount = stats[1];
  else if (type === "ROLE" && role) {
    initialCount = guild.members.cache.filter((member) => member.roles.cache.has(role.id)).size;
  }

  channelName += ` : ${initialCount}`;

  const vc = await guild.channels.create(channelName, {
    type: "GUILD_VOICE",
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: ["CONNECT"],
      },
      {
        id: guild.me.id,
        allow: ["VIEW_CHANNEL", "MANAGE_CHANNELS", "CONNECT"],
      },
    ],
  });

  const settings = await getSettings(guild);

  const exists = settings.counters.find((v) => v.counter_type.toUpperCase() === type && v.role_id === role?.id);
  if (exists) {
    exists.name = name;
    exists.channel_id = vc.id;
  } else {
    settings.counters.push({
      counter_type: type,
      channel_id: vc.id,
      name,
      role_id: role?.id,
    });
  }

  settings.data.bots = stats[1];
  await settings.save();

  return "Configuration saved! Counter channel created";
}
