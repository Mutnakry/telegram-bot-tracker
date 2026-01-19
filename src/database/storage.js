const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');
const BANNED_FILE = path.join(DATA_DIR, 'banned.json');
const RATE_LIMITS_FILE = path.join(DATA_DIR, 'rate_limits.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Load JSON data from file
 */
function loadData(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
  }
  return defaultValue;
}

/**
 * Save JSON data to file
 */
function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
    return false;
  }
}

/**
 * User Storage
 */
const userStorage = {
  load() {
    return loadData(USERS_FILE, {});
  },
  
  save(data) {
    return saveData(USERS_FILE, data);
  },
  
  getUser(userId) {
    const users = this.load();
    return users[userId] || null;
  },
  
  saveUser(userId, userData) {
    const users = this.load();
    users[userId] = {
      ...users[userId],
      ...userData,
      updated_at: new Date().toISOString()
    };
    return this.save(users);
  },
  
  getAllUsers() {
    return this.load();
  }
};

/**
 * Activity Storage
 */
const activityStorage = {
  load() {
    return loadData(ACTIVITIES_FILE, { users: {}, groups: {}, global: { commands: {}, buttons: {}, messages: 0 } });
  },
  
  save(data) {
    return saveData(ACTIVITIES_FILE, data);
  },
  
  addActivity(userId, activityType, data) {
    const activities = this.load();
    
    if (!activities.users[userId]) {
      activities.users[userId] = {
        commands: {},
        buttons: {},
        messages: 0,
        joins: [],
        leaves: []
      };
    }
    
    const timestamp = new Date().toISOString();
    
    switch (activityType) {
      case 'command':
        if (!activities.users[userId].commands[data.command]) {
          activities.users[userId].commands[data.command] = 0;
        }
        activities.users[userId].commands[data.command]++;
        
        // Global command tracking
        if (!activities.global.commands[data.command]) {
          activities.global.commands[data.command] = 0;
        }
        activities.global.commands[data.command]++;
        break;
        
      case 'button':
        if (!activities.users[userId].buttons[data.button]) {
          activities.users[userId].buttons[data.button] = 0;
        }
        activities.users[userId].buttons[data.button]++;
        
        // Global button tracking
        if (!activities.global.buttons[data.button]) {
          activities.global.buttons[data.button] = 0;
        }
        activities.global.buttons[data.button]++;
        break;
        
      case 'message':
        activities.users[userId].messages++;
        activities.global.messages++;
        break;
        
      case 'join':
        activities.users[userId].joins.push({
          chat_id: data.chatId,
          chat_title: data.chatTitle,
          timestamp
        });
        break;
        
      case 'leave':
        activities.users[userId].leaves.push({
          chat_id: data.chatId,
          chat_title: data.chatTitle,
          timestamp
        });
        break;
    }
    
    return this.save(activities);
  },
  
  addGroupActivity(chatId, activityType, data) {
    const activities = this.load();
    
    if (!activities.groups[chatId]) {
      activities.groups[chatId] = {
        commands: {},
        buttons: {},
        messages: 0,
        joins: 0,
        leaves: 0,
        members: []
      };
    }
    
    // Convert members array to Set for manipulation
    const membersSet = new Set(activities.groups[chatId].members || []);
    
    switch (activityType) {
      case 'command':
        if (!activities.groups[chatId].commands[data.command]) {
          activities.groups[chatId].commands[data.command] = 0;
        }
        activities.groups[chatId].commands[data.command]++;
        break;
        
      case 'button':
        if (!activities.groups[chatId].buttons[data.button]) {
          activities.groups[chatId].buttons[data.button] = 0;
        }
        activities.groups[chatId].buttons[data.button]++;
        break;
        
      case 'message':
        activities.groups[chatId].messages++;
        break;
        
      case 'join':
        activities.groups[chatId].joins++;
        if (data.userId) {
          membersSet.add(data.userId);
        }
        break;
        
      case 'leave':
        activities.groups[chatId].leaves++;
        if (data.userId) {
          membersSet.delete(data.userId);
        }
        break;
    }
    
    // Convert Set back to Array for JSON serialization
    activities.groups[chatId].members = Array.from(membersSet);
    
    return this.save(activities);
  },
  
  getUserActivity(userId) {
    const activities = this.load();
    return activities.users[userId] || null;
  },
  
  getGroupActivity(chatId) {
    const activities = this.load();
    return activities.groups[chatId] || null;
  },
  
  getGlobalStats() {
    const activities = this.load();
    return activities.global || {};
  }
};

/**
 * Group Storage
 */
const groupStorage = {
  load() {
    return loadData(GROUPS_FILE, {});
  },
  
  save(data) {
    return saveData(GROUPS_FILE, data);
  },
  
  getGroup(chatId) {
    const groups = this.load();
    return groups[chatId] || null;
  },
  
  saveGroup(chatId, groupData) {
    const groups = this.load();
    groups[chatId] = {
      ...groups[chatId],
      ...groupData,
      updated_at: new Date().toISOString()
    };
    return this.save(groups);
  },
  
  getAllGroups() {
    return this.load();
  }
};

/**
 * Referral Storage
 */
const referralStorage = {
  load() {
    return loadData(REFERRALS_FILE, { links: {}, users: {} });
  },
  
  save(data) {
    return saveData(REFERRALS_FILE, data);
  },
  
  createReferralLink(linkId, source) {
    const referrals = this.load();
    if (!referrals.links[linkId]) {
      referrals.links[linkId] = {
        source,
        created_at: new Date().toISOString(),
        clicks: 0,
        users: []
      };
      return this.save(referrals);
    }
    return false;
  },
  
  trackReferralClick(linkId, userId) {
    const referrals = this.load();
    if (referrals.links[linkId]) {
      referrals.links[linkId].clicks++;
      if (!referrals.links[linkId].users.includes(userId)) {
        referrals.links[linkId].users.push(userId);
      }
      
      // Track user's referral source
      if (!referrals.users[userId]) {
        referrals.users[userId] = {
          source_link: linkId,
          source: referrals.links[linkId].source,
          first_click: new Date().toISOString()
        };
      }
      
      return this.save(referrals);
    }
    return false;
  },
  
  getUserReferral(userId) {
    const referrals = this.load();
    return referrals.users[userId] || null;
  },
  
  getReferralLink(linkId) {
    const referrals = this.load();
    return referrals.links[linkId] || null;
  },
  
  getAllReferrals() {
    return this.load();
  }
};

/**
 * Banned Users Storage
 */
const bannedStorage = {
  load() {
    return loadData(BANNED_FILE, { users: {} });
  },
  
  save(data) {
    return saveData(BANNED_FILE, data);
  },
  
  banUser(userId, reason, bannedBy) {
    const banned = this.load();
    banned.users[userId] = {
      reason,
      banned_by: bannedBy,
      banned_at: new Date().toISOString()
    };
    return this.save(banned);
  },
  
  unbanUser(userId) {
    const banned = this.load();
    if (banned.users[userId]) {
      delete banned.users[userId];
      return this.save(banned);
    }
    return false;
  },
  
  isBanned(userId) {
    const banned = this.load();
    return !!banned.users[userId];
  },
  
  getBanInfo(userId) {
    const banned = this.load();
    return banned.users[userId] || null;
  },
  
  getAllBanned() {
    const banned = this.load();
    return banned.users;
  }
};

/**
 * Rate Limit Storage
 */
const rateLimitStorage = {
  load() {
    return loadData(RATE_LIMITS_FILE, {});
  },
  
  save(data) {
    return saveData(RATE_LIMITS_FILE, data);
  },
  
  checkRateLimit(userId, action, limit, windowMs) {
    const rateLimits = this.load();
    const key = `${userId}_${action}`;
    const now = Date.now();
    
    if (!rateLimits[key]) {
      rateLimits[key] = {
        count: 1,
        resetAt: now + windowMs
      };
      this.save(rateLimits);
      return { allowed: true, remaining: limit - 1 };
    }
    
    const limitData = rateLimits[key];
    
    // Reset if window expired
    if (now > limitData.resetAt) {
      rateLimits[key] = {
        count: 1,
        resetAt: now + windowMs
      };
      this.save(rateLimits);
      return { allowed: true, remaining: limit - 1 };
    }
    
    // Check if limit exceeded
    if (limitData.count >= limit) {
      return { 
        allowed: false, 
        remaining: 0,
        resetAt: limitData.resetAt
      };
    }
    
    // Increment count
    limitData.count++;
    this.save(rateLimits);
    
    return { 
      allowed: true, 
      remaining: limit - limitData.count,
      resetAt: limitData.resetAt
    };
  },
  
  resetRateLimit(userId, action) {
    const rateLimits = this.load();
    const key = `${userId}_${action}`;
    if (rateLimits[key]) {
      delete rateLimits[key];
      return this.save(rateLimits);
    }
    return false;
  }
};

module.exports = {
  userStorage,
  activityStorage,
  groupStorage,
  referralStorage,
  bannedStorage,
  rateLimitStorage
};
