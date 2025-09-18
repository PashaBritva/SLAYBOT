const { BaseContext } = require("@src/structures");
const { ContextMenuInteraction } = require("discord.js");
const profile = require("@commands/information/shared/profile");
const { error } = require("@src/helpers/logger")

module.exports = class Profile extends BaseContext {
  constructor(client) {
    super(client, {
      name: "Profile",
      description: "Get user's profile",
      type: "USER",
      enabled: true,
      ephemeral: true,
    });
  }

  /**
   * @param {ContextMenuInteraction} interaction
   */
  async run(interaction) {
    try {
      const user = await interaction.client.users.fetch(interaction.targetId);
      if (!user) return interaction.followUp({ content: "Couldn't get the user", ephemeral: true });

      const response = await profile(interaction, user);
      
      await interaction.followUp(response);
    } catch (err) {
      error("Error when executing the Context menu Profile:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.followUp({ content: "An error occurred while receiving the user profile", ephemeral: true });
      }
    }
  }
};
