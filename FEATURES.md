# Features Documentation

## Complete Feature List

### ✅ User Tracking
- [x] Track user starts (`/start` command)
- [x] Store user_id, username, first_name, last_name
- [x] Track language_code and approximate country
- [x] Track first_seen and last_seen timestamps
- [x] Track start_count (how many times user started bot)
- [x] Calculate active/inactive status (7 days threshold)

### ✅ Activity Tracking
- [x] Track all command usage
- [x] Track button clicks (callback queries)
- [x] Count messages per user
- [x] Track group joins with timestamp and group info
- [x] Track group leaves with timestamp and group info
- [x] Track activity per group
- [x] Global activity statistics

### ✅ Security & Anti-abuse
- [x] Rate limiting for commands (20/min)
- [x] Rate limiting for messages (30/min)
- [x] Rate limiting for buttons (50/min)
- [x] Ban/unban system with reason tracking
- [x] Spam detection based on activity patterns
- [x] Security checks before all actions
- [x] Silent ignore of banned users

### ✅ Admin Statistics
- [x] Comprehensive bot statistics (`/stats`)
- [x] User details (`/user <user_id>`)
- [x] Top active users ranking
- [x] Top active groups ranking
- [x] Most used commands
- [x] Most clicked buttons
- [x] Language distribution
- [x] Country distribution
- [x] Total users (active/inactive/banned)
- [x] Total groups tracked

### ✅ Marketing & Growth
- [x] Generate referral links (`/referral [source]`)
- [x] Track referral link clicks
- [x] Track user referral source
- [x] Referral statistics (clicks, unique users)
- [x] Parse referral from `/start` command

### ✅ Community Management
- [x] Track multiple groups
- [x] Group activity monitoring
- [x] Member join/leave tracking
- [x] Group statistics
- [x] User engagement metrics

## Data Tracked

### User Data
```json
{
  "user_id": 123456789,
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "language_code": "en",
  "country": "US/UK",
  "first_seen": "2024-01-01T00:00:00.000Z",
  "last_seen": "2024-01-15T00:00:00.000Z",
  "start_count": 5,
  "referral_link": "abc123xyz"
}
```

### Activity Data
```json
{
  "users": {
    "123456789": {
      "commands": { "/start": 5, "/help": 2 },
      "buttons": { "stats_users": 3, "stats_groups": 1 },
      "messages": 42,
      "joins": [
        { "chat_id": -100123456, "chat_title": "My Group", "timestamp": "..." }
      ],
      "leaves": []
    }
  },
  "groups": {
    "-100123456": {
      "commands": { "/status": 10 },
      "buttons": {},
      "messages": 150,
      "joins": 25,
      "leaves": 5,
      "members": [123456789, 987654321]
    }
  },
  "global": {
    "commands": { "/start": 100, "/help": 50 },
    "buttons": { "stats_users": 20 },
    "messages": 1000
  }
}
```

## API Reference

### User Tracker Module
```javascript
const { trackUserStart, getUserInfo, getUserStats } = require('./modules/userTracker');

// Track user start
trackUserStart(userId, userData, referralLinkId);

// Get user info
const user = getUserInfo(userId);

// Get user stats
const stats = getUserStats(userId);
```

### Activity Tracker Module
```javascript
const { trackCommand, trackButton, trackMessage, trackJoin, trackLeave } = require('./modules/activityTracker');

// Track command
trackCommand(userId, 'command_name', chatId, chatTitle);

// Track button click
trackButton(userId, 'button_id', chatId);

// Track message
trackMessage(userId, chatId);

// Track join
trackJoin(userId, chatId, chatTitle);

// Track leave
trackLeave(userId, chatId, chatTitle);
```

### Security Module
```javascript
const { canPerformAction, banUser, unbanUser, isBanned } = require('./modules/security');

// Check if action is allowed
const check = canPerformAction(userId, 'commands');
if (!check.allowed) {
  // Handle rate limit or ban
}

// Ban user
banUser(userId, 'Spam', adminUserId);

// Unban user
unbanUser(userId);

// Check if banned
if (isBanned(userId)) {
  // Handle banned user
}
```

### Marketing Tracker Module
```javascript
const { generateReferralLink, trackReferralClick, getReferralStats } = require('./modules/marketingTracker');

// Generate referral link
const linkId = generateReferralLink('telegram_channel');
const link = `https://t.me/${botUsername}?start=${linkId}`;

// Track click (automatically done in handlers)
trackReferralClick(linkId, userId);

// Get stats
const stats = getReferralStats();
```

### Admin Stats Module
```javascript
const { getBotStats, getUserStatsForAdmin, formatStatsForDisplay } = require('./modules/adminStats');

// Get comprehensive stats
const stats = getBotStats();

// Get user stats for admin
const userStats = getUserStatsForAdmin(userId);

// Format for display
const formatted = formatStatsForDisplay(stats);
```

## Example: Adding Buttons to Messages

You can add inline buttons to messages and they will be automatically tracked:

```javascript
const { trackCommand } = require('./modules/activityTracker');

bot.onText(/\/mystats/, async (msg) => {
  const userId = msg.from.id;
  trackCommand(userId, 'mystats', msg.chat.id);
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📊 View Stats', callback_data: 'stats_view' },
        { text: '👥 Top Users', callback_data: 'stats_users' }
      ],
      [
        { text: '🏆 Top Groups', callback_data: 'stats_groups' }
      ]
    ]
  };
  
  await bot.sendMessage(msg.chat.id, 'Choose an option:', {
    reply_markup: keyboard
  });
});
```

Button clicks are automatically tracked in `callbackHandler.js`.

## Rate Limits

Default rate limits (configurable in `src/modules/security.js`):

- **Commands**: 20 per minute
- **Messages**: 30 per minute  
- **Buttons**: 50 per minute
- **Spam Detection**: 10 actions per minute threshold

## Storage

All data is stored in JSON files in the `data/` directory:
- `users.json` - User information
- `activities.json` - Activity tracking
- `groups.json` - Group information
- `referrals.json` - Referral tracking
- `banned.json` - Banned users
- `rate_limits.json` - Rate limit tracking

For production, consider migrating to:
- PostgreSQL
- MongoDB
- SQLite
- Redis (for rate limits)

## Privacy & Compliance

⚠️ **Important**: This bot tracks user activity as allowed by Telegram API. Make sure to:
- Inform users about data collection
- Comply with GDPR/privacy regulations
- Allow users to request data deletion
- Secure stored data properly

## Future Enhancements

Potential features to add:
- [ ] Export data to CSV/JSON
- [ ] Web dashboard for statistics
- [ ] Scheduled reports
- [ ] Custom rate limits per user/group
- [ ] Advanced spam detection algorithms
- [ ] Integration with external analytics
- [ ] Database migration tools
- [ ] Backup/restore functionality
