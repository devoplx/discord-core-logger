const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { ActivityType } = require('discord.js')

const app = express();
const PORT = 9000; // Port for the Express server

// Replace with your actual bot token and server ID
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const SERVER_ID = '1117924566279401674';

// Load channel IDs from JSON file
const channelsPath = path.join(__dirname, 'channels.json');
const channels = JSON.parse(fs.readFileSync(channelsPath, 'utf8'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildVoiceStates
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
	client.user.setPresence({ 
    activities: [{ 
        name: 'over Devoplx discord logs', 
        type: ActivityType.Watching, 
    }], 
    status: 'online' 
});
  logEvent('BotStarted', { message: 'Bot has started successfully.', timestamp: Date.now()});
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  logEvent('Message', {
    action: 'created',
    author: message.author.tag,
    authorId: message.author.id,
    content: message.content,
    channel: message.channel.name,
    timestamp: message.createdAt
  });
});

client.on('messageUpdate', (oldMessage, newMessage) => {
  if (oldMessage.author.bot) return;
  logEvent('Message', {
    action: 'updated',
    author: oldMessage.author.tag,
    authorId: oldMessage.author.id,
    oldContent: oldMessage.content,
    newContent: newMessage.content,
    channel: oldMessage.channel.name,
    timestamp: newMessage.editedAt
  });
});

client.on('messageDelete', (message) => {
  if (message.author.bot) return;
  logEvent('Message', {
    action: 'deleted',
    author: message.author.tag,
    authorId: message.author.id,
    content: message.content,
    channel: message.channel.name,
    timestamp: message.createdAt
  });
});

client.on('guildMemberAdd', (member) => {
  logEvent('GuildMember', {
    action: 'joined',
    username: member.user.tag,
    userId: member.user.id,
    joinedAt: member.joinedAt,
    timestamp: new Date()
  });
});

client.on('guildMemberRemove', (member) => {
  logEvent('GuildMember', {
    action: 'left',
    username: member.user.tag,
    userId: member.user.id,
    leftAt: new Date()
  });
});

client.on('guildBanAdd', (ban) => {
  logEvent('GuildBan', {
    action: 'banned',
    username: ban.user.tag,
    userId: ban.user.id,
    reason: ban.reason || 'No reason provided',
    timestamp: new Date()
  });
});

client.on('guildBanRemove', (ban) => {
  logEvent('GuildBan', {
    action: 'unbanned',
    username: ban.user.tag,
    userId: ban.user.id,
    timestamp: new Date()
  });
});

client.on('guildUpdate', (oldGuild, newGuild) => {
  logEvent('GuildUpdate', {
    oldName: oldGuild.name,
    newName: newGuild.name,
    timestamp: new Date()
  });
});

client.on('guildRoleCreate', (role) => {
  logEvent('GuildRole', {
    action: 'created',
    roleName: role.name,
    roleId: role.id,
    createdAt: role.createdAt,
    timestamp: new Date()
  });
});

client.on('guildRoleDelete', (role) => {
  logEvent('GuildRole', {
    action: 'deleted',
    roleName: role.name,
    roleId: role.id,
    timestamp: new Date()
  });
});

client.on('guildRoleUpdate', (oldRole, newRole) => {
  logEvent('GuildRole', {
    action: 'updated',
    oldName: oldRole.name,
    newName: newRole.name,
    roleId: oldRole.id,
    timestamp: new Date()
  });
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
  logEvent('GuildMember', {
    action: 'updated',
    username: oldMember.user.tag,
    userId: oldMember.user.id,
    oldNickname: oldMember.nickname,
    newNickname: newMember.nickname,
    timestamp: new Date()
  });
});

client.on('voiceStateUpdate', (oldState, newState) => {
  logEvent('VoiceState', {
    user: oldState.member.user.tag,
    userId: oldState.member.user.id,
    oldChannel: oldState.channel ? oldState.channel.name : 'None',
    newChannel: newState.channel ? newState.channel.name : 'None',
    timestamp: new Date()
  });
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
  logEvent('Presence', {
    user: oldPresence.user.tag,
    userId: oldPresence.user.id,
    oldStatus: oldPresence.status,
    newStatus: newPresence.status,
    timestamp: new Date()
  });
});

client.login(DISCORD_TOKEN);

app.use(bodyParser.json());

app.post('/send-embed', async (req, res) => {
  const { channelId, color, title, description } = req.body;

  try {
    const guild = client.guilds.cache.get(SERVER_ID);
    if (!guild) {
      return res.status(404).send('Server not found.');
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).send('Channel not found.');
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: `Devoplx Core Logger System` });

    await channel.send({ embeds: [embed] });
    res.status(200).send('Embed sent successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Function to log events to the specified channels using embeds
function logEvent(eventType, data) {
  const channelId = channels[eventType];
  if (channelId) {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(getColorForEvent(eventType))
        .setTitle(getTitleForEvent(eventType, data.action))
        .setDescription(formatDescription(eventType, data))
        .setTimestamp(data.timestamp || new Date())
        .setFooter({ text: `Devoplx Core Logger System` });

      channel.send({ embeds: [embed] }).catch(console.error);
    } else {
      console.error(`Channel with ID ${channelId} not found`);
    }
  } else {
    console.error(`No channel configured for event: ${eventType}`);
  }
}

function getColorForEvent(eventType) {
  const colors = {
    'Message': '#00FF00',
    'GuildMember': '#0000FF',
    'GuildBan': '#FF0000',
    'GuildUpdate': '#FFA500',
    'GuildRole': '#800080',
    'VoiceState': '#008080',
    'Presence': '#808080',
    'BotStarted': '#0000FF',
  };
  return colors[eventType] || '#0099ff';
}

function getTitleForEvent(eventType, action) {
  const titles = {
    'Message': `Message ${action}`,
    'GuildMember': `Member ${action}`,
    'GuildBan': `Member ${action}`,
    'GuildUpdate': 'Guild Updated',
    'GuildRole': `Role ${action}`,
    'VoiceState': 'Voice State Updated',
    'Presence': 'Presence Updated',
    'BotStarted': 'Bot Started',
  };
  return titles[eventType] || 'Event';
}

function formatDescription(eventType, data) {
  switch (eventType) {
    case 'Message':
      return `**Action**: ${data.action}\n**Author**: ${data.author} (${data.authorId})\n**Channel**: ${data.channel}\n**Content**: ${data.content}\n**Timestamp**: ${data.timestamp}`;
    case 'GuildMember':
      return `**Action**: ${data.action}\n**Username**: ${data.username} (${data.userId})\n${data.action === 'joined' ? `**Joined At**: ${data.joinedAt}` : data.action === 'left' ? `**Left At**: ${data.leftAt}` : `**Old Nickname**: ${data.oldNickname}\n**New Nickname**: ${data.newNickname}`}\n**Timestamp**: ${data.timestamp}`;
    case 'GuildBan':
      return `**Action**: ${data.action}\n**Username**: ${data.username} (${data.userId})\n${data.action === 'banned' ? `**Reason**: ${data.reason}` : ''}\n**Timestamp**: ${data.timestamp}`;
    case 'GuildUpdate':
      return `**Old Name**: ${data.oldName}\n**New Name**: ${data.newName}\n**Timestamp**: ${data.timestamp}`;
    case 'GuildRole':
      return `**Action**: ${data.action}\n**Role Name**: ${data.roleName} (${data.roleId})\n${data.action === 'created' ? `**Created At**: ${data.createdAt}` : data.action === 'updated' ? `**Old Name**: ${data.oldName}\n**New Name**: ${data.newName}` : ''}\n**Timestamp**: ${data.timestamp}`;
    case 'VoiceState':
      return `**User**: ${data.user} (${data.userId})\n**Old Channel**: ${data.oldChannel}\n**New Channel**: ${data.newChannel}\n**Timestamp**: ${data.timestamp}`;
    case 'Presence':
      return `**User**: ${data.user} (${data.userId})\n**Old Status**: ${data.oldStatus}\n**New Status**: ${data.newStatus}\n**Timestamp**: ${data.timestamp}`;
    case 'BotStarted':
      return `**Message**: ${data.message}\n**Timestamp**: ${data.timestamp}`;
    default:
      return `**Data**: ${JSON.stringify(data, null, 2)}`;
  }
}
