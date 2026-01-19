const { isGroupTracked, getTrackedGroup } = require('../bot');
const { trackUserStart, getUserStats } = require('../modules/userTracker');
const { trackCommand, getUserActivity } = require('../modules/activityTracker');
const { parseReferralFromStart, getUserReferralSource } = require('../modules/marketingTracker');
const { canPerformAction, isBanned } = require('../modules/security');
const { getBotStats, getUserStatsForAdmin, formatStatsForDisplay } = require('../modules/adminStats');
const { groupStorage } = require('../database/storage');

// Admin user IDs (set in .env as comma-separated list)
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) : [];

/**
 * Check if user is admin
 */
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

/**
 * Setup command handlers
 * @param {TelegramBot} bot - The Telegram bot instance
 */
function setup(bot) {
  // Handle /start command
  bot.onText(/\/start(?:\s+(.+))?/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userData = msg.from;
    const text = msg.text || '';
    
    // Check if banned
    if (isBanned(userId)) {
      return; // Silently ignore banned users
    }
    
    // Check rate limit
    const securityCheck = canPerformAction(userId, 'commands');
    if (!securityCheck.allowed) {
      await bot.sendMessage(chatId, `⚠️ ${securityCheck.reason}`);
      return;
    }
    
    // Parse referral link
    const referralLinkId = parseReferralFromStart(text);
    
    // Track user start
    trackUserStart(userId, userData, referralLinkId);
    
    // Track referral click if referral link exists
    if (referralLinkId) {
      const { trackReferralClick } = require('../modules/marketingTracker');
      trackReferralClick(referralLinkId, userId);
    }
    
    // Track command
    trackCommand(userId, 'start', chatId, msg.chat.title);
    
    if (msg.chat.type === 'private') {
      const referral = getUserReferralSource(userId);
      let referralText = '';
      if (referral) {
        referralText = `\n\n🔗 Referral Source: ${referral.source}`;
      }
      
      await bot.sendMessage(chatId, 
        '👋 Hello! I am a Telegram Bot Tracker.\n\n' +
        '📋 Features:\n' +
        '• Track user activity\n' +
        '• Monitor commands and button clicks\n' +
        '• Track group joins/leaves\n' +
        '• Admin statistics\n' +
        '• Referral tracking\n\n' +
        '🔧 Setup:\n' +
        '1. Add me to a group\n' +
        '2. Make me an administrator\n' +
        '3. I will automatically start tracking\n\n' +
        'Use /help for more commands' +
        referralText
      );
    }
  });

  // Handle /status command
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const chatType = msg.chat.type;
    
    // Check security
    const securityCheck = canPerformAction(userId, 'commands');
    if (!securityCheck.allowed) {
      return;
    }
    
    // Track command
    trackCommand(userId, 'status', chatId, msg.chat.title);
    
    if (chatType === 'group' || chatType === 'supergroup') {
      const group = groupStorage.getGroup(chatId);
      const { getGroupActivity } = require('../modules/activityTracker');
      const activity = getGroupActivity(chatId);
      
      if (group) {
        const membersCount = activity?.members?.length || 0;
        await bot.sendMessage(chatId, 
          `📊 **Group Status:**\n` +
          `   Title: ${group.title || 'Unknown'}\n` +
          `   Members: ${membersCount}\n` +
          `   Messages: ${activity?.messages || 0}\n` +
          `   Joins: ${activity?.joins || 0}\n` +
          `   Leaves: ${activity?.leaves || 0}\n` +
          `   Tracking since: ${group.added_at ? new Date(group.added_at).toLocaleString() : 'Unknown'}`
        );
      } else {
        await bot.sendMessage(chatId, 
          '⚠️ This group is not being tracked yet.\n' +
          'Make sure I am an administrator in this group.'
        );
      }
    } else {
      // Private chat - show user stats
      const userStats = getUserStats(userId);
      const activity = getUserActivity(userId);
      
      if (userStats) {
        await bot.sendMessage(chatId,
          `📊 **Your Stats:**\n` +
          `   User ID: ${userStats.user_id}\n` +
          `   Username: @${userStats.username || 'N/A'}\n` +
          `   Language: ${userStats.language_code || 'N/A'}\n` +
          `   Country: ${userStats.country || 'N/A'}\n` +
          `   First seen: ${new Date(userStats.first_seen).toLocaleString()}\n` +
          `   Last seen: ${new Date(userStats.last_seen).toLocaleString()}\n` +
          `   Messages: ${activity?.messages || 0}\n` +
          `   Commands: ${Object.values(activity?.commands || {}).reduce((a, b) => a + b, 0)}\n` +
          `   Buttons: ${Object.values(activity?.buttons || {}).reduce((a, b) => a + b, 0)}`
        );
      }
    }
  });

  // Handle /stats command (admin only)
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check if admin
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, '❌ This command is only available for administrators.');
      return;
    }
    
    // Check security
    const securityCheck = canPerformAction(userId, 'commands');
    if (!securityCheck.allowed) {
      return;
    }
    
    // Track command
    trackCommand(userId, 'stats', chatId);
    
    const stats = getBotStats();
    const formattedStats = formatStatsForDisplay(stats);
    
    await bot.sendMessage(chatId, formattedStats, { parse_mode: 'Markdown' });
  });

  // Handle /user command (admin only) - Get user info
  bot.onText(/\/user(?:\s+(\d+))?/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetUserId = msg.text.match(/\d+/)?.[0] ? parseInt(msg.text.match(/\d+/)[0]) : null;
    
    // Check if admin
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, '❌ This command is only available for administrators.');
      return;
    }
    
    // Track command
    trackCommand(userId, 'user', chatId);
    
    if (!targetUserId) {
      await bot.sendMessage(chatId, 'Usage: /user <user_id>');
      return;
    }
    
    const userStats = getUserStatsForAdmin(targetUserId);
    if (userStats) {
      const activity = userStats.activity;
      const totalCommands = Object.values(activity.commands || {}).reduce((a, b) => a + b, 0);
      const totalButtons = Object.values(activity.buttons || {}).reduce((a, b) => a + b, 0);
      
      await bot.sendMessage(chatId,
        `👤 **User Information:**\n` +
        `   User ID: ${userStats.user_id}\n` +
        `   Username: @${userStats.username || 'N/A'}\n` +
        `   Name: ${userStats.first_name || ''} ${userStats.last_name || ''}\n` +
        `   Language: ${userStats.language_code || 'N/A'}\n` +
        `   Country: ${userStats.country || 'N/A'}\n` +
        `   First seen: ${new Date(userStats.first_seen).toLocaleString()}\n` +
        `   Last seen: ${new Date(userStats.last_seen).toLocaleString()}\n` +
        `   Active: ${userStats.is_active ? 'Yes' : 'No'}\n\n` +
        `📊 **Activity:**\n` +
        `   Messages: ${activity.messages || 0}\n` +
        `   Commands: ${totalCommands}\n` +
        `   Buttons: ${totalButtons}\n` +
        `   Joins: ${activity.joins?.length || 0}\n` +
        `   Leaves: ${activity.leaves?.length || 0}\n` +
        (userStats.banned ? `\n⚠️ **BANNED**\n   Reason: ${userStats.ban_info?.reason || 'N/A'}` : '') +
        (userStats.referral ? `\n🔗 **Referral:** ${userStats.referral.source}` : ''),
        { parse_mode: 'Markdown' }
      );
    } else {
      await bot.sendMessage(chatId, 'User not found.');
    }
  });

  // Handle /ban command (admin only)
  bot.onText(/\/ban(?:\s+(\d+))(?:\s+(.+))?/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const match = msg.text.match(/\/ban\s+(\d+)(?:\s+(.+))?/);
    
    // Check if admin
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, '❌ This command is only available for administrators.');
      return;
    }
    
    // Track command
    trackCommand(userId, 'ban', chatId);
    
    if (!match) {
      await bot.sendMessage(chatId, 'Usage: /ban <user_id> [reason]');
      return;
    }
    
    const targetUserId = parseInt(match[1]);
    const reason = match[2] || 'No reason provided';
    
    const { banUser } = require('../modules/security');
    banUser(targetUserId, reason, userId);
    
    await bot.sendMessage(chatId, `✅ User ${targetUserId} has been banned.\nReason: ${reason}`);
  });

  // Handle /unban command (admin only)
  bot.onText(/\/unban(?:\s+(\d+))/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const match = msg.text.match(/\/unban\s+(\d+)/);
    
    // Check if admin
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, '❌ This command is only available for administrators.');
      return;
    }
    
    // Track command
    trackCommand(userId, 'unban', chatId);
    
    if (!match) {
      await bot.sendMessage(chatId, 'Usage: /unban <user_id>');
      return;
    }
    
    const targetUserId = parseInt(match[1]);
    
    const { unbanUser } = require('../modules/security');
    unbanUser(targetUserId);
    
    await bot.sendMessage(chatId, `✅ User ${targetUserId} has been unbanned.`);
  });

  // Handle /referral command - Generate referral link
  bot.onText(/\/referral(?:\s+(.+))?/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const match = msg.text.match(/\/referral(?:\s+(.+))?/);
    
    // Check security
    const securityCheck = canPerformAction(userId, 'commands');
    if (!securityCheck.allowed) {
      return;
    }
    
    // Track command
    trackCommand(userId, 'referral', chatId);
    
    const source = match && match[1] ? match[1].trim() : 'direct';
    const { generateReferralLink } = require('../modules/marketingTracker');
    const botInfo = await bot.getMe();
    const linkId = generateReferralLink(source);
    const referralLink = `https://t.me/${botInfo.username}?start=${linkId}`;
    
    await bot.sendMessage(chatId,
      `🔗 **Referral Link Created:**\n\n` +
      `Source: ${source}\n` +
      `Link: ${referralLink}\n\n` +
      `Share this link to track users who join through it!`
    );
  });

  // Handle /help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check security
    const securityCheck = canPerformAction(userId, 'commands');
    if (!securityCheck.allowed) {
      return;
    }
    
    // Track command
    trackCommand(userId, 'help', chatId);
    
    let helpText = '📖 **Commands:**\n\n';
    helpText += '**User Commands:**\n';
    helpText += '/start - Get started with the bot\n';
    helpText += '/status - Check your stats or group status\n';
    helpText += '/referral [source] - Generate referral link\n';
    helpText += '/help - Show this help message\n\n';
    
    if (isAdmin(userId)) {
      helpText += '**Admin Commands:**\n';
      helpText += '/stats - View bot statistics\n';
      helpText += '/user <user_id> - Get user information\n';
      helpText += '/ban <user_id> [reason] - Ban a user\n';
      helpText += '/unban <user_id> - Unban a user\n';
    }
    
    await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  });
}

module.exports = {
  setup,
  isAdmin
};

