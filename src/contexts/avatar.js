const { BaseContext } = require("@src/structures");
const { ContextMenuInteraction } = require("discord.js");
const avatar = require("@commands/information/shared/avatar");
const { error } = require("@src/helpers/logger")

module.exports = class Avatar extends BaseContext {
  constructor(client) {
    super(client, {
      name: "Avatar",
      description: "Displays avatar information about the user",
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

      const response = avatar(user);
      
      await interaction.followUp(response);
    } catch (err) {
      error("Error when executing Avatar context menu:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.followUp({ content: "An error occurred while receiving the avatar", ephemeral: true });
      }
    }
  }
};
