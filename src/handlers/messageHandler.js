const { addTrackedGroup, isGroupTracked, getTrackedGroup } = require('../bot');
const { trackUserStart } = require('../modules/userTracker');
const { trackMessage, trackJoin, trackLeave } = require('../modules/activityTracker');
const { canPerformAction, isBanned, detectSpammer } = require('../modules/security');
const { groupStorage } = require('../database/storage');

/**
 * Setup message event handlers
 * @param {TelegramBot} bot - The Telegram bot instance
 */
function setup(bot) {
  // Handle bot being added to a group and track new members
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    const userId = msg.from?.id;
    
    // Skip if no user (system messages)
    if (!userId) {
      return;
    }
    
    // Check if banned
    if (isBanned(userId)) {
      return; // Silently ignore banned users
    }
    
    // Track regular messages (not commands, not system messages)
    if (msg.text && !msg.text.startsWith('/')) {
      // Check security
      const securityCheck = canPerformAction(userId, 'messages');
      if (securityCheck.allowed) {
        trackMessage(userId, chatId);
        
        // Detect spam
        const spamCheck = detectSpammer(userId, {});
        if (spamCheck.isSpammer) {
          console.log(`⚠️ Potential spammer detected: ${userId} - ${spamCheck.reason}`);
          // You can add auto-ban logic here if needed
        }
      }
    }
    
    // Check if bot was added to a group or supergroup
    if (chatType === 'group' || chatType === 'supergroup') {
      // Check if this is a new member event (bot being added)
      if (msg.new_chat_members && msg.new_chat_members.length > 0) {
        await handleNewMembers(bot, msg, chatId, chatType);
      }
      
      // Track when users leave the group
      if (msg.left_chat_member) {
        await handleMemberLeft(bot, msg, chatId);
      }
    }
  });
}

/**
 * Handle new members added to group
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - Message object
 * @param {number} chatId - Chat ID
 * @param {string} chatType - Chat type
 */
async function handleNewMembers(bot, msg, chatId, chatType) {
  const newMembers = msg.new_chat_members;
  const botInfo = await bot.getMe();
  
  // Check if bot itself was added
  const botWasAdded = newMembers.some(member => member.id === botInfo.id);
  
  if (botWasAdded) {
    await handleBotAdded(bot, msg, chatId, chatType, botInfo);
  }
  
  // Track new users added to the group
  if (isGroupTracked(chatId)) {
    await trackNewMembers(bot, msg, chatId, newMembers, botInfo);
  }
}

/**
 * Handle bot being added to a group
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - Message object
 * @param {number} chatId - Chat ID
 * @param {string} chatType - Chat type
 * @param {Object} botInfo - Bot information
 */
async function handleBotAdded(bot, msg, chatId, chatType, botInfo) {
  console.log(`✅ Bot added to group: ${msg.chat.title} (ID: ${chatId})`);
  
  // Check if bot is admin
  try {
    const chatMember = await bot.getChatMember(chatId, botInfo.id);
    if (chatMember.status === 'administrator' || chatMember.status === 'creator') {
      addTrackedGroup(chatId, {
        title: msg.chat.title,
        type: chatType
      });
      
      // Also save to group storage
      groupStorage.saveGroup(chatId, {
        title: msg.chat.title,
        type: chatType,
        added_at: new Date().toISOString()
      });
      
      console.log(`✅ Bot is admin in group: ${msg.chat.title}`);
      
      // Send confirmation message
      await bot.sendMessage(chatId, 
        '✅ Bot is now tracking this group!\n' +
        'I will monitor user activity, commands, and member changes.'
      );
    } else {
      console.log(`⚠️ Bot is not admin in group: ${msg.chat.title}`);
      await bot.sendMessage(chatId, 
        '⚠️ Please make me an administrator to track group members properly.'
      );
    }
  } catch (error) {
    console.error('Error checking admin status:', error.message);
  }
}

/**
 * Track new members added to the group
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - Message object
 * @param {number} chatId - Chat ID
 * @param {Array} newMembers - Array of new members
 * @param {Object} botInfo - Bot information
 */
async function trackNewMembers(bot, msg, chatId, newMembers, botInfo) {
  const group = getTrackedGroup(chatId);
  const chatTitle = msg.chat.title || 'Unknown Group';
  
  for (const member of newMembers) {
    // Don't track the bot itself
    if (member.id !== botInfo.id) {
      const userId = member.id;
      const username = member.username || 'No username';
      const firstName = member.first_name || 'Unknown';
      const lastName = member.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Track user start if not already tracked
      trackUserStart(userId, member);
      
      // Track join event
      trackJoin(userId, chatId, chatTitle);
      
      // Update group members
      if (group) {
        group.members.add(userId);
      }
      
      console.log(`\n📊 NEW MEMBER ADDED TO GROUP:`);
      console.log(`   Group: ${chatTitle}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Name: ${fullName}`);
      console.log(`   Username: @${username}`);
      console.log(`   Language: ${member.language_code || 'N/A'}`);
      console.log(`   Time: ${new Date().toLocaleString()}\n`);
      
      // Optional: Send notification to group
      // Uncomment if you want notifications
      /*
      await bot.sendMessage(chatId, 
        `👤 New member added:\n` +
        `   Name: ${fullName}\n` +
        `   Username: @${username}\n` +
        `   User ID: ${userId}\n` +
        `   Time: ${new Date().toLocaleString()}`
      );
      */
    }
  }
}

/**
 * Handle member leaving the group
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - Message object
 * @param {number} chatId - Chat ID
 */
async function handleMemberLeft(bot, msg, chatId) {
  if (!isGroupTracked(chatId)) {
    return;
  }
  
  const group = getTrackedGroup(chatId);
  const leftMember = msg.left_chat_member;
  const botInfo = await bot.getMe();
  const chatTitle = msg.chat.title || 'Unknown Group';
  
  // Don't track if bot itself left
  if (leftMember.id !== botInfo.id) {
    const userId = leftMember.id;
    
    // Track leave event
    trackLeave(userId, chatId, chatTitle);
    
    // Update group members
    if (group) {
      group.members.delete(userId);
    }
    
    console.log(`\n📊 MEMBER LEFT GROUP:`);
    console.log(`   Group: ${chatTitle}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Name: ${leftMember.first_name || 'Unknown'}`);
    console.log(`   Time: ${new Date().toLocaleString()}\n`);
  }
}

module.exports = {
  setup
};

