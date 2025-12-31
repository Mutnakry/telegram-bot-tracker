const messageHandler = require('./messageHandler');
const commandHandler = require('./commandHandler');

/**
 * Setup all event handlers
 * @param {TelegramBot} bot - The Telegram bot instance
 */
function setupHandlers(bot) {
  // Setup message handlers
  messageHandler.setup(bot);
  
  // Setup command handlers
  commandHandler.setup(bot);
}

module.exports = {
  setupHandlers
};

