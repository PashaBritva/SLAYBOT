// undici-proxy.js - Sets up proxy for all undici requests (used by discord.js)
const { setGlobalDispatcher, ProxyAgent } = require('undici');

// Set global proxy for undici
const proxyAgent = new ProxyAgent('http://127.0.0.1:12334');
setGlobalDispatcher(proxyAgent);

// Now require the bot
require('./bot');
