const ms = require("pretty-ms");
const moment = require("moment");

/**
 * @param {string} durationStr
 * @returns {number}
 */
function parseDuration(durationStr) {
  const regex = /^(\d+)([smhdw])$/i;
  const match = durationStr.match(regex);

  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s": return moment.duration(value, "seconds").asMilliseconds();
    case "m": return moment.duration(value, "minutes").asMilliseconds();
    case "h": return moment.duration(value, "hours").asMilliseconds();
    case "d": return moment.duration(value, "days").asMilliseconds();
    case "w": return moment.duration(value, "weeks").asMilliseconds();
    default: return null;
  }
}

/**
 * @param {number} msValue
 * @returns {string}
 */
function formatDuration(msValue) {
  if (!msValue || msValue <= 0) return "0s";
  return ms(msValue, { verbose: false, compact: true });
}

module.exports = {
  parseDuration,
  formatDuration,
};
