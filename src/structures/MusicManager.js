const { Manager } = require("erela.js");
const { MUSIC } = require("@root/config");

module.exports = class MusicManager extends Manager {
  constructor(client) {
    super({
      nodes: MUSIC.NODES,
      autoPlay: true,
      
      defaultSearchPlatform: "youtube",
      
      send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
      },
    });
  }
};