const { handleTicketOpen, handleTicketClose } = require("@src/handlers/ticket");
const { error } = require("@src/helpers/logger");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Interaction} interaction
 */
module.exports = async (client, interaction) => {
  try {
    if (!interaction.guild) {
      return await interaction
        .reply({ content: "Command can only be executed in a server", ephemeral: true })
        .catch(() => {});
    }

    if (interaction.isCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (command) {
        await command.executeInteraction(interaction);
      } else if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "An error occurred", ephemeral: true }).catch(() => {});
      }
    }

    else if (interaction.isContextMenu()) {
      const context = client.contextMenus.get(interaction.commandName);
      if (context) {
        await context.execute(interaction);
      } else if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "An error occurred", ephemeral: true }).catch(() => {});
      }
    }

    else if (interaction.isButton()) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
      }

      switch (interaction.customId) {
        case "TICKET_CREATE":
          await handleTicketOpen(interaction);
          break;

        case "TICKET_CLOSE":
          await handleTicketClose(interaction);
          break;
      }
    }
  } catch (err) {
    error("Interaction error:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction
        .reply({ content: "An error occurred while processing this interaction", ephemeral: true })
        .catch(() => {});
    }
  }
};
