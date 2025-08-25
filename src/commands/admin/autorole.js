const { Command } = require("@src/structures");
const { getSettings } = require("@schemas/Guild");
const { Message, CommandInteraction } = require("discord.js");
const { findMatchingRoles } = require("@utils/guildUtils");

module.exports = class AutoRole extends Command {
  constructor(client) {
    super(client, {
      name: "autorole",
      description: "setup roles to be given when a member joins the server",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<role|off>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "add",
            description: "add a new autorole",
            type: "SUB_COMMAND",
            options: [
              {
                name: "role",
                description: "the role to be added",
                type: "ROLE",
                required: false,
              },
              {
                name: "role_id",
                description: "the role id to be added",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "remove",
            description: "remove an autorole",
            type: "SUB_COMMAND",
            options: [
              {
                name: "role",
                description: "the role to be removed",
                type: "ROLE",
                required: false,
              },
              {
                name: "role_id",
                description: "the role id to be removed",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "list",
            description: "show current autoroles",
            type: "SUB_COMMAND",
          },
          {
            name: "clear",
            description: "disable all autoroles",
            type: "SUB_COMMAND",
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
    const input = args.join(" ");
    let response;

    if (input.toLowerCase() === "off") {
      response = await clearAutoRoles(message);
    } else if (input.toLowerCase() === "list") {
      response = await listAutoRoles(message);
    } else {
      const roles = findMatchingRoles(message.guild, input);
      if (roles.length === 0) response = "No matching roles found matching your query";
      else response = await addAutoRole(message, roles[0]);
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // add
    if (sub === "add") {
      let role = interaction.options.getRole("role");
      if (!role) {
        const role_id = interaction.options.getString("role_id");
        if (!role_id) return interaction.followUp("Please provide a role or role id");

        const roles = findMatchingRoles(interaction.guild, role_id);
        if (roles.length === 0) return interaction.followUp("No matching roles found matching your query");
        role = roles[0];
      }

      response = await addAutoRole(interaction, role);
    }

    // remove
    else if (sub === "remove") {
      let role = interaction.options.getRole("role");
      if (!role) {
        const role_id = interaction.options.getString("role_id");
        if (!role_id) return interaction.followUp("Please provide a role or role id");

        const roles = findMatchingRoles(interaction.guild, role_id);
        if (roles.length === 0) return interaction.followUp("No matching roles found matching your query");
        role = roles[0];
      }

      response = await removeAutoRole(interaction, role);
    }

    // list
    else if (sub === "list") {
      response = await listAutoRoles(interaction);
    }

    // clear
    else if (sub === "clear") {
      response = await clearAutoRoles(interaction);
    }

    // default
    else response = "Invalid subcommand";

    await interaction.followUp(response);
  }
};

async function addAutoRole({ guild }, role) {
  const settings = await getSettings(guild);

  if (!guild.me.permissions.has("MANAGE_ROLES")) return "I don't have the `MANAGE_ROLES` permission";
  if (guild.me.roles.highest.position < role.position) return "I don't have the permissions to assign this role";
  if (role.managed) return "Oops! This role is managed by an integration";

  // Initialize autorole as array if not exists
  if (!settings.autorole) settings.autorole = [];
  
  // Check if role already exists
  if (settings.autorole.includes(role.id)) {
    return `The role ${role.name} is already in the autorole list!`;
  }

  settings.autorole.push(role.id);
  await settings.save();
  return `Successfully added ${role.name} to autoroles!`;
}

async function removeAutoRole({ guild }, role) {
  const settings = await getSettings(guild);

  if (!settings.autorole || !Array.isArray(settings.autorole) || settings.autorole.length === 0) {
    return "There are no autoroles configured!";
  }

  const index = settings.autorole.indexOf(role.id);
  if (index === -1) return `The role ${role.name} is not in the autorole list!`;

  settings.autorole.splice(index, 1);
  await settings.save();
  return `Successfully removed ${role.name} from autoroles!`;
}

async function listAutoRoles({ guild }) {
  const settings = await getSettings(guild);

  if (!settings.autorole || !Array.isArray(settings.autorole) || settings.autorole.length === 0) {
    return "No autoroles are currently configured!";
  }

  const roles = settings.autorole
    .map((roleId) => guild.roles.cache.get(roleId))
    .filter((role) => role !== undefined)
    .map((role) => role.name)
    .join(", ");

  return `Current autoroles: ${roles || "None"}`;
}

async function clearAutoRoles({ guild }) {
  const settings = await getSettings(guild);
  settings.autorole = [];
  await settings.save();
  return "All autoroles have been cleared!";
}