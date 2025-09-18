const { Collection, PermissionFlagsBits } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const { getMember } = require("@schemas/Member");
const { error } = require("@src/helpers/logger");

const getEffectiveInvites = (inviteData = {}) =>
  (inviteData.tracked + inviteData.added - inviteData.fake - inviteData.left) || 0;

const cacheInvite = (invite, isVanity = false) => ({
  code: invite.code,
  uses: invite.uses,
  maxUses: invite.maxUses,
  inviterId: isVanity ? "VANITY" : invite.inviter?.id ?? null,
});

/**
 * Cache all guild invites
 * @param {import("discord.js").Guild} guild
 */
async function cacheGuildInvites(guild) {
  if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) return new Collection();

  let invites;
  try {
    invites = await guild.invites.fetch();
  } catch (err) {
    error(`Error fetching invites for guild ${guild.id}`, err);
    invites = new Collection();
  }

  const tempMap = new Collection();
  invites.forEach((inv) => tempMap.set(inv.code, cacheInvite(inv)));

  if (guild.vanityURLCode) {
    try {
      const vanity = await guild.fetchVanityData();
      tempMap.set(guild.vanityURLCode, cacheInvite(vanity, true));
    } catch {}
  }

  guild.client.inviteCache.set(guild.id, tempMap);
  return tempMap;
}

/**
 * Add or remove roles to inviter based on invite counts
 * @param {import("discord.js").Guild} guild
 * @param {Object} inviterData
 * @param {boolean} isAdded
 */
const checkInviteRewards = async (guild, inviterData = {}, isAdded) => {
  const settings = await getSettings(guild);
  if (!settings.invite.ranks.length || !inviterData?.member_id) return;

  const inviter = await guild.members.fetch(inviterData.member_id).catch(() => null);
  if (!inviter) return;

  const invites = getEffectiveInvites(inviterData.invite_data);

  settings.invite.ranks.forEach((reward) => {
    if (isAdded) {
      if (invites + 1 >= reward.invites && !inviter.roles.cache.has(reward._id)) {
        inviter.roles.add(reward._id).catch(() => {});
      }
    } else {
      if (invites - 1 < reward.invites && inviter.roles.cache.has(reward._id)) {
        inviter.roles.remove(reward._id).catch(() => {});
      }
    }
  });
};

/**
 * Track inviter when a member joins
 * @param {import("discord.js").GuildMember} member
 */
async function trackJoinedMember(member) {
  const { guild } = member;

  const cachedInvites = guild.client.inviteCache.get(guild.id) || new Collection();
  const newInvites = await cacheGuildInvites(guild);

  let usedInvite;

  usedInvite = newInvites.find(
    (inv) =>
      inv.uses > 0 &&
      cachedInvites.get(inv.code) &&
      cachedInvites.get(inv.code).uses < inv.uses
  );

  if (!usedInvite) {
    cachedInvites
      .sort((a, b) => (a.deletedTimestamp && b.deletedTimestamp ? b.deletedTimestamp - a.deletedTimestamp : 0))
      .forEach((inv) => {
        if (
          !newInvites.get(inv.code) &&
          inv.maxUses > 0 &&
          inv.uses === inv.maxUses - 1
        ) {
          usedInvite = inv;
        }
      });
  }

  let inviterData = {};
  if (usedInvite) {
    const inviterId = usedInvite.code === guild.vanityURLCode ? "VANITY" : usedInvite.inviterId;

    const memberDb = await getMember(guild.id, member.id);
    memberDb.invite_data.inviter = inviterId;
    memberDb.invite_data.code = usedInvite.code;
    await memberDb.save();

    const inviterDb = await getMember(guild.id, inviterId);
    inviterDb.invite_data.tracked += 1;
    await inviterDb.save();
    inviterData = inviterDb;
  }

  await checkInviteRewards(guild, inviterData, true);
  return inviterData;
}

/**
 * Track inviter when a member leaves
 * @param {import("discord.js").Guild} guild
 * @param {import("discord.js").User} user
 */
async function trackLeftMember(guild, user) {
  const settings = await getSettings(guild);
  if (!settings.invite.tracking) return;

  const memberDb = await getMember(guild.id, user.id);
  const inviteData = memberDb.invite_data;

  let inviterData = {};
  if (inviteData.inviter) {
    const inviterId = inviteData.inviter === "VANITY" ? "VANITY" : inviteData.inviter;
    const inviterDb = await getMember(guild.id, inviterId);
    inviterDb.invite_data.left += 1;
    await inviterDb.save();
    inviterData = inviterDb;
  }

  await checkInviteRewards(guild, inviterData, false);
  return inviterData;
}

module.exports = {
  trackJoinedMember,
  trackLeftMember,
  cacheGuildInvites,
  checkInviteRewards,
  getEffectiveInvites,
  cacheInvite,
};
