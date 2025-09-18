const { GiveawaysManager } = require("discord-giveaways");
const Model = require("@schemas/Giveaways");
const { EMBED_COLORS } = require("@root/config");
const { success, warn, error, log } = require("@src/helpers/logger");

module.exports = class GiveawayManager extends GiveawaysManager {
  constructor(client) {
    super(client, {
      default: {
        botsCanWin: false,
        embedColor: EMBED_COLORS.GIVEAWAYS,
        embedColorEnd: EMBED_COLORS.GIVEAWAYS,
        reaction: "🎁",
      },
    });
  }

  async getAllGiveaways() {
    return await Model.find().lean().exec();
  }

  async saveGiveaway(messageId, giveawayData) {
    try {
      await Model.create(giveawayData);
      success(`[GIVEAWAYS] Saved giveaway ${messageId}`);
      return true;
    } catch (e) {
      error(`[GIVEAWAYS] Failed to save giveaway ${messageId}:`, e);
      return false;
    }
  }

  async editGiveaway(messageId, giveawayData) {
    try {
      await Model.findOneAndUpdate(
        { messageId },
        giveawayData,
        { new: true, omitUndefined: true }
      );
      log(`[GIVEAWAYS] Edited giveaway ${messageId}`);
      return true;
    } catch (e) {
      error(`[GIVEAWAYS] Failed to edit giveaway ${messageId}:`, e);
      return false;
    }
  }

  async deleteGiveaway(messageId) {
    try {
      const res = await Model.deleteOne({ messageId }).exec();
      if (res.deletedCount > 0) {
        log(`[GIVEAWAYS] Deleted giveaway ${messageId}`);
        return true;
      }
      return false;
    } catch (e) {
      error(`[GIVEAWAYS] Failed to delete giveaway ${messageId}:`, e);
      return false;
    }
  }
};
