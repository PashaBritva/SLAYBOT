const { getTicketConfig } = require("@schemas/Message");
const { openTicket, closeTicket } = require("@utils/ticketUtils");

/**
 * Handle ticket opening
 * @param {import("discord.js").ButtonInteraction} interaction
 */
async function handleTicketOpen(interaction) {
  if (!interaction.guild || !interaction.channel) return;

  const config = await getTicketConfig(interaction.guildId, interaction.channelId, interaction.message.id);
  if (!config) return;

  const status = await openTicket(interaction.guild, interaction.user, config.ticket);

  const messages = {
    MISSING_PERMISSIONS: "Cannot create ticket channel, missing `Manage Channel` permission. Contact server manager for help!",
    ALREADY_EXISTS: "You already have an open ticket",
    TOO_MANY_TICKETS: "There are too many open tickets. Try again later",
    FAILED: "Failed to create ticket channel, an error occurred!",
    SUCCESS: "Ticket created! 🔥",
  };

  await interaction.followUp({
    content: messages[status] || "Unknown error occurred",
    ephemeral: true,
  });
}

/**
 * Handle ticket closing
 * @param {import("discord.js").ButtonInteraction} interaction
 */
async function handleTicketClose(interaction) {
  if (!interaction.guild || !interaction.channel) return;

  const status = await closeTicket(interaction.channel, interaction.user);

  const messages = {
    MISSING_PERMISSIONS: "Cannot close the ticket, missing permissions. Contact server manager for help!",
    ERROR: "Failed to close the ticket, an error occurred!",
    SUCCESS: "Ticket closed successfully! ✅",
  };

  await interaction.followUp({
    content: messages[status] || "Unknown error occurred",
    ephemeral: true,
  });
}

module.exports = {
  handleTicketOpen,
  handleTicketClose,
};
