// Store tracked groups (in production, use a database)
const trackedGroups = new Map();

/**
 * Initialize the bot
 * @param {TelegramBot} bot - The Telegram bot instance
 */
function initializeBot(bot) {
  // Bot is ready
  console.log('✅ Bot initialized successfully');
}

/**
 * Get tracked groups map
 * @returns {Map} Map of tracked groups
 */
function getTrackedGroups() {
  return trackedGroups;
}

/**
 * Add a group to tracking
 * @param {number} chatId - Chat ID of the group
 * @param {Object} groupData - Group data
 */
function addTrackedGroup(chatId, groupData) {
  trackedGroups.set(chatId, {
    title: groupData.title,
    type: groupData.type,
    addedAt: new Date(),
    members: new Set()
  });
}

/**
 * Check if a group is being tracked
 * @param {number} chatId - Chat ID of the group
 * @returns {boolean} True if group is tracked
 */
function isGroupTracked(chatId) {
  return trackedGroups.has(chatId);
}

/**
 * Get tracked group data
 * @param {number} chatId - Chat ID of the group
 * @returns {Object|null} Group data or null
 */
function getTrackedGroup(chatId) {
  return trackedGroups.get(chatId) || null;
}

module.exports = {
  initializeBot,
  getTrackedGroups,
  addTrackedGroup,
  isGroupTracked,
  getTrackedGroup
};

