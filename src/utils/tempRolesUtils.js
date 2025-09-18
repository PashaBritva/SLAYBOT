const TemporaryRole = require("@schemas/TemporaryRoles");

module.exports = (client) => {
  client.once("ready", () => {
    setInterval(async () => {
      const now = new Date();
      let expiredRoles;

      try {
        expiredRoles = await TemporaryRole.find({ expiresAt: { $lte: now } });
      } catch (err) {
        client.logger.error("Failed to query expired roles", err);
        return;
      }

      for (const record of expiredRoles) {
        try {
          const guild = await client.guilds.fetch(record.guildId).catch(() => null);
          if (!guild) {
            await TemporaryRole.deleteOne({ _id: record._id });
            continue;
          }

          const member = await guild.members.fetch(record.userId).catch(() => null);
          if (!member) {
            await TemporaryRole.deleteOne({ _id: record._id });
            continue;
          }

          const role = guild.roles.cache.get(record.roleId);
          if (!role) {
            await TemporaryRole.deleteOne({ _id: record._id });
            continue;
          }

          if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role).catch(() => null);
            client.logger.log(
              `Removed expired role ${role.id} from user ${member.id} in guild ${guild.id}`
            );
          }

          await TemporaryRole.deleteOne({ _id: record._id });
        } catch (err) {
          client.logger.error(
            `Failed to remove role ${record.roleId} from user ${record.userId}`,
            err
          );
        }
      }
    }, 60 * 1000);
  });
};
