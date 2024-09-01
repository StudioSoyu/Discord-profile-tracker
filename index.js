const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [Partials.Channel],
});
const TOKEN = 'YourToken';
const GUILD_ID = 'YourGuildId';
const OUTPUT_FILE = path.join(__dirname, 'users.json');

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('Fila Server', { type: ActivityType.Watching });
    setInterval(fetchGuildMembers, 1000);
});

async function fetchGuildMembers() {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const members = await guild.members.fetch();
        const memberData = members.map((member) => ({
            id: member.id,
            username: member.user.username,
            avatar: member.user.displayAvatarURL(),
            status: member.presence ? member.presence.status : 'offline',
        }));
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(memberData, null, 2));
        console.log('Member data updated');
    } catch (error) {
        console.error('Error fetching guild members:', error);
    }
}

client.login(TOKEN);
