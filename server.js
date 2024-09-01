const express = require('express');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const sharp = require('sharp');

const app = express();
const PORT = 3002;
const USERS_FILE = path.join(__dirname, 'users.json');
const LOGO_FILE = path.join(__dirname, 'Discord-logo.png');

const FONT_PATH = path.join(__dirname, 'Montserrat-Bold.ttf');
registerFont(FONT_PATH, { family: 'Montserrat' });

async function fetchAndConvertImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        return await sharp(buffer).toFormat('png').toBuffer();
    } catch (error) {
        console.error('Error fetching or converting image:', error.message);
        throw error;
    }
}
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Join Our Server</title>
            </head>
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f4f4f4;">
                <div style="text-align: center;">
                    <h1>Welcome to Fila!</h1>
                    <p>Please join the server to start tracking your activities.</p>
                    <a href="https://discord.gg/rwsHDTcZbe" style="text-decoration: none; color: #fff; background-color: #7289DA; padding: 10px 20px; border-radius: 5px;">Join the Server</a>
                </div>
            </body>
        </html>
    `);
});
app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const user = users.find((u) => u.id === userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const imgBuffer = await fetchAndConvertImage(user.avatar);
        const logoBuffer = fs.readFileSync(LOGO_FILE);

        const canvas = createCanvas(250, 100);
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 250, 100);
        gradient.addColorStop(0, '#1e2a38');
        gradient.addColorStop(1, '#15202B');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 250, 100);

        const profilePicSize = 80;
        const profilePicX = 10;
        const profilePicY = 50;

        ctx.save();
        ctx.beginPath();
        ctx.arc(profilePicX + profilePicSize / 2, profilePicY, profilePicSize / 2 + 4, 0, Math.PI * 2); // Border radius

        ctx.save();
        ctx.beginPath();
        ctx.arc(profilePicX + profilePicSize / 2, profilePicY, profilePicSize / 2, 0, Math.PI * 2);
        ctx.clip();
        const imgObj = await loadImage(imgBuffer);
        ctx.drawImage(imgObj, profilePicX, profilePicY - profilePicSize / 2, profilePicSize, profilePicSize);
        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 17px Montserrat';
        ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        ctx.fillText(user.username, profilePicX + profilePicSize + 15, profilePicY - 15);
        ctx.shadowColor = 'transparent';

        let statusColor;
        if (user.status === 'online') statusColor = '#3BA55A';
        if (user.status === 'idle') statusColor = '#F9A41C';
        if (user.status === 'dnd') statusColor = '#F0464B';
        if (user.status === 'offline') statusColor = '#737E8D';

        ctx.font = 'bold 12px Montserrat';
        ctx.fillStyle = statusColor;
        const userStatus = user.status.charAt(0).toUpperCase() + user.status.slice(1);
        ctx.fillText(userStatus || 'No status', profilePicX + profilePicSize + 15, profilePicY + 10);

        const logoObj = await loadImage(logoBuffer);

        const maxLogoSize = 70;

        const logoWidth = logoObj.width;
        const logoHeight = logoObj.height;
        const aspectRatio = logoWidth / logoHeight;

        let logoDrawWidth = maxLogoSize;
        let logoDrawHeight = maxLogoSize;

        if (logoWidth > logoHeight) {
            logoDrawHeight = maxLogoSize / aspectRatio;
        } else {
            logoDrawWidth = maxLogoSize * aspectRatio;
        }

        const logoX = 250 - logoDrawWidth - 10;
        const logoY = 100 - logoDrawHeight - 2;

        ctx.drawImage(logoObj, logoX, logoY, logoDrawWidth, logoDrawHeight);

        res.set('Content-Type', 'image/png');
        canvas.pngStream().pipe(res);
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).send('Internal server error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
