module.exports = {
  /**
   * @param {string} durationStr
   * @returns {number}
   */
  parseDuration(durationStr) {
    const regex = /(\d+)([dhm])/g;
    let matches;
    let totalMs = 0;

    while ((matches = regex.exec(durationStr)) !== null) {
      const value = parseInt(matches[1], 10);
      const unit = matches[2];

      switch (unit) {
        case "d":
          totalMs += value * 24 * 60 * 60 * 1000;
          break;
        case "h":
          totalMs += value * 60 * 60 * 1000;
          break;
        case "m":
          totalMs += value * 60 * 1000;
          break;
      }
    }

    return totalMs;
  },

  /**
   * @param {number} ms
   * @returns {string}
   */
  formatDuration(ms) {
    if (ms === 0) return "Forever";

    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    const parts = [];
    if (days) parts.push(`${days}д`);
    if (hours) parts.push(`${hours}ч`);
    if (minutes) parts.push(`${minutes}м`);

    return parts.join(" ") || "0м";
  },
};
