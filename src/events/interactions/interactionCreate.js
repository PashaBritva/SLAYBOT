const { handleTicketOpen, handleTicketClose } = require("@src/handlers/ticket");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Interaction} interaction
 */
module.exports = async (client, interaction) => {
  try {
    if (!interaction.guild) {
      return await interaction
        .reply({ content: "Command can only be executed in a discord server", ephemeral: true })
        .catch(() => {});
    }

    // Slash Command
    if (interaction.isCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (command) {
        await command.executeInteraction(interaction);
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "An error has occurred", ephemeral: true }).catch(() => {});
        }
      }
    }

    // Context Menu
    else if (interaction.isContextMenu()) {
      const context = client.contextMenus.get(interaction.commandName);
      if (context) {
        await context.execute(interaction);
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "An error has occurred", ephemeral: true }).catch(() => {});
        }
      }
    }

    // Custom Buttons
    else if (interaction.isButton()) {
      if (interaction.customId === "TICKET_CREATE") {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferReply({ ephemeral: true });
        }
        await handleTicketOpen(interaction);
      }

      else if (interaction.customId === "TICKET_CLOSE") {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferReply({ ephemeral: true });
        }
        await handleTicketClose(interaction);
      }
    }
  } catch (error) {
    console.error("Interaction error:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: "An error occurred while processing this interaction", 
        ephemeral: true 
      }).catch(() => {});
    }
  }
};