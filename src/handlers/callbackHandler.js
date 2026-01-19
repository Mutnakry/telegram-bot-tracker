const { trackButton } = require('../modules/activityTracker');
const { canPerformAction } = require('../modules/security');

/**
 * Setup callback query handlers (button clicks)
 * @param {TelegramBot} bot - The Telegram bot instance
 */
function setup(bot) {
  // Handle callback queries (button clicks)
  bot.on('callback_query', async (query) => {
    const userId = query.from.id;
    const chatId = query.message?.chat?.id;
    const data = query.data;
    
    // Check security
    const securityCheck = canPerformAction(userId, 'buttons');
    if (!securityCheck.allowed) {
      await bot.answerCallbackQuery(query.id, {
        text: securityCheck.reason || 'Action not allowed',
        show_alert: true
      });
      return;
    }
    
    // Track button click
    trackButton(userId, data, chatId);
    
    // Answer callback query to remove loading state
    await bot.answerCallbackQuery(query.id);
    
    // Handle different button actions
    if (data.startsWith('stats_')) {
      // Handle stats button clicks
      const action = data.replace('stats_', '');
      // You can add specific handlers for different stat buttons here
    }
    
    // Add more button handlers as needed
  });
}

module.exports = {
  setup
};
