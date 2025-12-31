require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { initializeBot } = require('./bot');
const { setupHandlers } = require('./handlers');

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram Tracker Bot is running...');

// Initialize bot
initializeBot(bot);

// Setup event handlers
setupHandlers(bot);

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

