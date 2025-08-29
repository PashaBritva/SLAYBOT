const TemporaryRole = require("@schemas/TemporaryRoles");

module.exports = (client) => {
  setInterval(async () => {
    const now = new Date();
    const expiredRoles = await TemporaryRole.find({ expiresAt: { $lte: now } });

    for (const record of expiredRoles) {
      try {
        const guild = await client.guilds.fetch(record.guildId);
        const member = await guild.members.fetch(record.userId);
        await member.roles.remove(record.roleId);
        await TemporaryRole.deleteOne({ _id: record._id });
        client.logger.log(`Removed expired role ${record.roleId} from user ${record.userId}`);
      } catch (err) {
        client.logger.error(`Failed to remove role ${record.roleId} from user ${record.userId}`, err);
      }
    }
  }, 60 * 1000);
};
