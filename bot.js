// bot.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000; // Port for the Express server

// Replace with your actual bot token and server ID
const DISCORD_TOKEN = process.env.token;
const SERVER_ID = '1117924566279401674';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(DISCORD_TOKEN);

app.use(bodyParser.json());

app.post('/send-embed', async (req, res) => {
  const { channelId, color, title, username, description } = req.body;

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
      .setFooter({ text: username });

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
