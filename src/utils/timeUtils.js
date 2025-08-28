// src/utils/timeUtils.js

/**
 * @param {string} durationStr - строка вида "1d", "2h", "30m" и т.д.
 * @returns {number} время в миллисекундах или 0 при некорректном формате
 */
function parseDuration(durationStr) {
  const regex = /^(\d+)([smhdw])$/i;
  const match = durationStr.match(regex);
  
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

/**
 * @param {number} ms - время в миллисекундах
 * @returns {string} отформатированная строка ("1d 2h 30m")
 */
function formatDuration(ms) {
  if (ms <= 0) return "0s";

  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) % 7;
  const weeks = Math.floor(ms / (1000 * 60 * 60 * 24 * 7));

  let result = "";
  if (weeks > 0) result += `${weeks}w `;
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (seconds > 0) result += `${seconds}s`;

  return result.trim() || "0s";
}

module.exports = {
  parseDuration,
  formatDuration
};