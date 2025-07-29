module.exports = {
  parseDuration(durationStr) {
    const regex = /(\d+)([dhm])/g;
    let matches;
    let totalMilliseconds = 0;
    
    while ((matches = regex.exec(durationStr)) !== null) {
      const value = parseInt(matches[1]);
      const unit = matches[2];
      
      switch(unit) {
        case 'd': totalMilliseconds += value * 24 * 60 * 60 * 1000; break;
        case 'h': totalMilliseconds += value * 60 * 60 * 1000; break;
        case 'm': totalMilliseconds += value * 60 * 1000; break;
      }
    }
    
    return totalMilliseconds;
  },
  
  formatDuration(ms) {
    if (ms === 0) return "Навсегда";
    
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    
    const parts = [];
    if (days > 0) parts.push(`${days}д`);
    if (hours > 0) parts.push(`${hours}ч`);
    if (minutes > 0) parts.push(`${minutes}м`);
    
    return parts.join(" ");
  }
};