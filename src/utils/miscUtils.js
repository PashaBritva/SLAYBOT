const { countryCodeExists } = require("country-language");
const data = require("@src/data.json");

const LINK_PATTERN = /\b((https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^\s]*)?\b/gi;

const DISCORD_INVITE_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?(discord\.(?:gg|io|me|li|link|plus)|discord(?:app)?\.com\/invite|invite\.gg|dsc\.gg|urlcord\.cf)\/([a-zA-Z0-9-]+)/gi;

/**
 * Checks if a string contains a URL
 * @param {string} text
 */
function containsLink(text) {
  LINK_PATTERN.lastIndex = 0;
  return LINK_PATTERN.test(text);
}

/**
 * Checks if a string is a valid discord invite
 * @param {string} text
 */
function containsDiscordInvite(text) {
  DISCORD_INVITE_PATTERN.lastIndex = 0;
  return DISCORD_INVITE_PATTERN.test(text);
}

/**
 * Returns a random number below a max
 * @param {Number} max
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Checks if a string is a valid Hex color
 * @param {string} text
 */
function isHex(text) {
  return /^#[0-9A-F]{6}$/i.test(text);
}

/**
 * Returns hour difference between two dates
 * @param {Date} dt2
 * @param {Date} dt1
 */
function diffHours(dt2, dt1) {
  let diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60 * 60;
  return Math.abs(Math.round(diff));
}

/**
 * Returns remaining time in days, hours, minutes and seconds
 * @param {number} timeInSeconds
 */
function timeformat(timeInSeconds) {
  const days = Math.floor((timeInSeconds % 31536000) / 86400);
  const hours = Math.floor((timeInSeconds % 86400) / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.round(timeInSeconds % 60);

  return [
    days > 0 && `${days} days`,
    hours > 0 && `${hours} hours`,
    minutes > 0 && `${minutes} minutes`,
    seconds > 0 && `${seconds} seconds`
  ].filter(Boolean).join(", ");
}


/**
 * Converts duration to milliseconds
 * @param {string} duration
 */
function durationToMillis(duration) {
  const parts = duration.split(":").map(Number).reverse();
  let millis = 0;
  if (parts[0]) millis += parts[0] * 1000;
  if (parts[1]) millis += parts[1] * 60 * 1000;
  if (parts[2]) millis += parts[2] * 3600 * 1000;
  return millis;
}

/**
 * Returns time remaining until provided date
 * @param {Date} timeUntil
 */
function getRemainingTime(timeUntil) {
  const seconds = Math.abs((timeUntil - new Date()) / 1000);
  const time = timeformat(seconds);
  return time;
}

/**
 * Returns country code from flag emoji or null if not found
 * @param {string} emoji
 */
function getCountryFromFlag(emoji) {
  const chars = Array.from(emoji);
  if (chars.length === 2) {
    const countryCode = data.UNICODE_LETTER[chars[0]] + data.UNICODE_LETTER[chars[1]];
    if (countryCodeExists(countryCode)) return countryCode;
  }
  return null;
}

module.exports = {
  containsLink,
  containsDiscordInvite,
  getRandomInt,
  isHex,
  diffHours,
  timeformat,
  durationToMillis,
  getRemainingTime,
  getCountryFromFlag,
};
