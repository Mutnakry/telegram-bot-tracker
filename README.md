# Telegram Group Tracker Bot

A Node.js Telegram bot that tracks when users are added to Telegram groups. The bot monitors group membership and logs new member additions.

## Features

- ✅ Automatically detects when bot is added to a group
- ✅ Verifies bot admin status
- ✅ Tracks new members added to tracked groups
- ✅ Logs member information (ID, name, username, timestamp)
- ✅ Sends notifications to the group when new members join
- ✅ Tracks when members leave the group
- ✅ Status command to check tracking status

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
```

Or copy the example file:
```bash
cp .env.example .env
```

Then edit `.env` and add your bot token.

### 3. Run the Bot

```bash
npm start
```

Or for development:
```bash
node bot.js
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
   - The bot will now track all new members added to the group

### Commands

- `/start` - Get started with the bot (works in private chat)
- `/status` - Check tracking status in the current group
- `/help` - Show help message

## How It Works

1. When the bot is added to a group, it checks if it has admin privileges
2. If admin, the bot starts tracking the group
3. When a new user is added to the group, the bot:
   - Logs the event to console with details
   - Sends a notification message to the group
   - Stores the member information

## Logging

The bot logs all tracking events to the console:
- When bot is added to a group
- When new members join
- When members leave
- Member details (ID, name, username, timestamp)

## Notes

- The bot needs to be an administrator to properly track group members
- Member tracking data is stored in memory (use a database for production)
- The bot will track all groups it's added to as admin

## Troubleshooting

**Bot not tracking members:**
- Make sure the bot is an administrator in the group
- Check that the bot has permission to read messages
- Verify the bot token is correct in `.env` file

**Bot not responding:**
- Check if the bot is running (look for "Bot is running..." message)
- Verify your internet connection
- Check the console for error messages

## License

ISC

