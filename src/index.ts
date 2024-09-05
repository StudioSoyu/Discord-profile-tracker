import { Client, GatewayIntentBits, Partials, ActivityType, SlashCommandBuilder, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [Partials.Channel],
});

const TOKEN: string = 'Token';
const GUILD_ID: string = 'GuildId';
const CLIENT_ID: string = 'ClientId';
const OUTPUT_FILE: string = path.join(__dirname, 'users.json');

client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);

    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
    });

    client.user?.setActivity('Fila Server', { type: ActivityType.Watching });
    setInterval(fetchGuildMembers, 1000);
});

async function fetchGuildMembers(): Promise<void> {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const members = await guild.members.fetch();
        const memberData = await Promise.all(
            members.map(async (member) => {
                return {
                    id: member.id,
                    globalName: member.user.username,
                    displayName: member.user.displayName || member.user.username,
                    avatar: member.user.displayAvatarURL(),
                    status: member.presence ? member.presence.status : 'offline',
                };
            })
        );
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(memberData, null, 2));
        console.log('Member data updated');
    } catch (error) {
        console.error('Error fetching guild members:', error);
    }
}

const rest: REST = new REST({ version: '10' }).setToken(TOKEN);

const commands: Array<SlashCommandBuilder> = [new SlashCommandBuilder().setName('use').setDescription('use fila')];

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        if (commandName === 'use') {
            await interaction.reply(`
# Github Readme
\`\`\`[![DiscordProfile](https://fila.aleu.xyz/discord/user/${interaction.user.id})](https://discord.com/users/${interaction.user.id})\`\`\`
# Preview
https://fila.aleu.xyz/discord/user/${interaction.user.id}
            `);
        }
    }
});

client.login(TOKEN);
