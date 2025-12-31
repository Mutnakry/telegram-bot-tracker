const { isGroupTracked, getTrackedGroup } = require('../bot');

/**
 * Setup command handlers
 * @param {TelegramBot} bot - The Telegram bot instance
 */
function setup(bot) {
  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (msg.chat.type === 'private') {
      await bot.sendMessage(chatId, 
        '👋 Hello! I am a Telegram Group Tracker Bot.\n\n' +
        '📋 How to use:\n' +
        '1. Add me to a group\n' +
        '2. Make me an administrator\n' +
        '3. I will automatically track when users are added to the group\n\n' +
        '✅ Once set up, I will log all new members and send notifications to the group.'
      );
    }
  });

  // Handle /status command
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    
    if (chatType === 'group' || chatType === 'supergroup') {
      if (isGroupTracked(chatId)) {
        const group = getTrackedGroup(chatId);
        await bot.sendMessage(chatId, 
          `📊 Tracking Status:\n` +
          `   Group: ${group.title}\n` +
          `   Members tracked: ${group.members.size}\n` +
          `   Tracking since: ${group.addedAt.toLocaleString()}`
        );
      } else {
        await bot.sendMessage(chatId, 
          '⚠️ This group is not being tracked yet.\n' +
          'Make sure I am an administrator in this group.'
        );
      }
    }
  });

  // Handle /help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot.sendMessage(chatId, 
      '📖 Commands:\n\n' +
      '/start - Get started with the bot\n' +
      '/status - Check tracking status in current group\n' +
      '/help - Show this help message\n\n' +
      '🔧 Setup:\n' +
      '1. Add bot to your group\n' +
      '2. Make bot an administrator\n' +
      '3. Bot will automatically start tracking new members'
    );
  });
}

module.exports = {
  setup
};

