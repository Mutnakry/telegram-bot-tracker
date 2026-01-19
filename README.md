# Telegram Bot Tracker

A comprehensive Node.js Telegram bot tracker that monitors user activity, commands, button clicks, group joins/leaves, and provides admin statistics. Perfect for community management, marketing campaigns, and security monitoring.

## Features

### 👥 User Tracking
- **User Start Tracking**: Track when users start the bot
- **User Information**: Username, user_id, first_name, last_name
- **Language & Country**: Approximate country detection from language_code
- **Timestamps**: First seen and last seen dates
- **Activity Status**: Active/inactive user detection

### 📊 Activity Tracking
- **Command Tracking**: Track all command usage (`/start`, `/help`, etc.)
- **Button Click Tracking**: Track inline button interactions
- **Message Counting**: Count messages sent by users
- **Join/Leave Events**: Track when users join or leave groups
- **Group Activity**: Track activity per group

### 🛡️ Security & Anti-abuse
- **Rate Limiting**: Prevent spam with configurable rate limits
  - Commands: 20 per minute
  - Messages: 30 per minute
  - Buttons: 50 per minute
- **Ban System**: Ban/unban users with reason tracking
- **Spam Detection**: Automatic detection of suspicious activity patterns
- **Security Checks**: All actions are validated before execution

### 📈 Admin Statistics
- **Bot Statistics**: Comprehensive bot usage statistics
- **Top Users**: Most active users ranking
- **Top Groups**: Most active groups ranking
- **Command Statistics**: Most used commands
- **Language Distribution**: User language breakdown
- **Country Distribution**: User country breakdown
- **User Details**: Detailed user information and activity

### 🔗 Marketing & Growth
- **Referral Links**: Generate and track referral links
- **Source Tracking**: Track where users come from (channel, group, etc.)
- **Campaign Performance**: Measure referral link effectiveness
- **Click Tracking**: Track referral link clicks and conversions

### 👥 Community Management
- **Group Tracking**: Track multiple groups
- **Member Management**: Monitor group membership
- **Activity Monitoring**: See which groups are most active
- **User Engagement**: Track user engagement metrics

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Telegram bot token (get one from [@BotFather](https://t.me/BotFather))

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_IDS=123456789,987654321
```

- `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
- `ADMIN_IDS`: Comma-separated list of user IDs who can use admin commands

To get your user ID:
1. Start a chat with [@userinfobot](https://t.me/userinfobot)
2. Send `/start`
3. Copy your user ID

### 3. Run the Bot

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## How to Use

### Setting Up the Bot in a Group

1. **Add the bot to your Telegram group**
   - Open your Telegram group
   - Click on group name → Add Members
   - Search for your bot username and add it

2. **Make the bot an administrator**
   - Go to group settings → Administrators
   - Add the bot as an administrator
   - Grant necessary permissions (at minimum, the bot needs to read messages)

3. **Bot will automatically start tracking**
   - Once the bot is added as admin, it will send a confirmation message
   - The bot will now track all user activity in the group

## Commands

### User Commands

- `/start [referral_id]` - Get started with the bot. Optionally include a referral ID to track source.
- `/status` - Check your personal stats (in private chat) or group status (in groups)
- `/referral [source]` - Generate a referral link with optional source name
- `/help` - Show help message with all available commands

### Admin Commands (Admin Only)

- `/stats` - View comprehensive bot statistics
- `/user <user_id>` - Get detailed information about a specific user
- `/ban <user_id> [reason]` - Ban a user from using the bot
- `/unban <user_id>` - Unban a previously banned user

## What Can Be Tracked

Telegram bots can only track what Telegram API allows. This bot tracks:

✅ **Available Tracking:**
- `user_id` - Unique user identifier
- `username` - Telegram username
- `first_name` / `last_name` - User's name
- `language_code` - User's language preference
- `chat_id` - Private chat or group ID
- `message text` - Message content
- `command usage` - All commands used
- `join / leave events` - Group membership changes
- `button click (callback)` - Inline button interactions

❌ **Cannot Track:**
- User's phone number
- User's exact location
- Private conversations between users
- Messages in groups where bot is not a member
- Deleted messages (unless bot is admin and message was deleted while bot was active)

## Data Storage

Data is stored in JSON files in the `data/` directory:
- `users.json` - User information and metadata
- `activities.json` - All activity tracking data
- `groups.json` - Group information
- `referrals.json` - Referral link tracking
- `banned.json` - Banned users list
- `rate_limits.json` - Rate limit tracking

**Note**: For production use, consider migrating to a proper database (PostgreSQL, MongoDB, etc.)

## Security Features

### Rate Limiting
The bot implements rate limiting to prevent abuse:
- **Commands**: 20 per minute per user
- **Messages**: 30 per minute per user
- **Buttons**: 50 per minute per user

Users exceeding limits will receive an error message.

### Ban System
Admins can ban users who misuse the bot:
- Ban includes reason tracking
- Banned users are silently ignored
- Ban information is stored with timestamp and admin ID

### Spam Detection
The bot automatically detects suspicious patterns:
- Excessive message rate
- Excessive command usage
- Excessive button clicks
- Logs potential spammers for admin review

## Referral System

### Creating Referral Links

1. Use `/referral [source]` command
2. Bot generates a unique link: `https://t.me/your_bot?start=REFERRAL_ID`
3. Share the link in channels, groups, or campaigns

### Tracking Referrals

- When users click referral link and start bot, their source is tracked
- View referral statistics with `/stats` (admin only)
- Track which sources bring the most users

Example:
```
/referral telegram_channel
→ Generates: https://t.me/your_bot?start=abc123xyz
→ Source: telegram_channel
```

## Admin Statistics

Admins can view comprehensive statistics:

- **User Statistics**: Total, active, inactive, banned users
- **Group Statistics**: Total groups tracked
- **Activity Statistics**: Total commands, buttons, messages
- **Top Commands**: Most used commands
- **Top Users**: Most active users
- **Top Groups**: Most active groups
- **Language Distribution**: User languages breakdown
- **Country Distribution**: User countries breakdown
- **Referral Statistics**: Referral link performance

## Project Structure

```
telegram-bot-tracker/
├── src/
│   ├── index.js              # Main entry point
│   ├── bot.js                # Bot initialization
│   ├── database/
│   │   └── storage.js        # Data storage layer
│   ├── modules/
│   │   ├── userTracker.js    # User tracking logic
│   │   ├── activityTracker.js # Activity tracking
│   │   ├── marketingTracker.js # Referral tracking
│   │   ├── security.js       # Security features
│   │   └── adminStats.js     # Admin statistics
│   └── handlers/
│       ├── index.js          # Handler setup
│       ├── commandHandler.js # Command handlers
│       ├── messageHandler.js # Message handlers
│       └── callbackHandler.js # Button click handlers
├── data/                     # Data storage (auto-created)
├── .env                      # Environment variables
├── package.json
└── README.md
```

## Troubleshooting

**Bot not tracking:**
- Make sure the bot is an administrator in the group
- Check that the bot has permission to read messages
- Verify the bot token is correct in `.env` file

**Admin commands not working:**
- Verify your user ID is in `ADMIN_IDS` in `.env`
- User IDs must be comma-separated numbers

**Rate limit errors:**
- This is normal security behavior
- Wait a minute and try again
- Admins can adjust rate limits in `src/modules/security.js`

**Data not persisting:**
- Check that `data/` directory exists and is writable
- Verify file permissions

## Development

### Adding New Commands

1. Add command handler in `src/handlers/commandHandler.js`
2. Track command usage with `trackCommand(userId, 'command_name', chatId)`
3. Update help text in `/help` command

### Adding New Tracking

1. Add tracking function in appropriate module (`userTracker.js`, `activityTracker.js`, etc.)
2. Call tracking function from handlers
3. Update storage schema if needed

### Customizing Rate Limits

Edit `RATE_LIMITS` in `src/modules/security.js`:

```javascript
const RATE_LIMITS = {
  commands: { limit: 20, windowMs: 60000 },
  messages: { limit: 30, windowMs: 60000 },
  buttons: { limit: 50, windowMs: 60000 }
};
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.