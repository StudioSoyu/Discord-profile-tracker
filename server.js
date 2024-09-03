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

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arc(x + width - radius, y + radius, radius, 1.5 * Math.PI, 2 * Math.PI);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arc(x + width - radius, y + height - radius, radius, 0, 0.5 * Math.PI);
    ctx.lineTo(x + radius, y + height);
    ctx.arc(x + radius, y + height - radius, radius, 0.5 * Math.PI, Math.PI);
    ctx.lineTo(x, y + radius);
    ctx.arc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI);
    ctx.closePath();
    ctx.fill();
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
    const theme = req.query.theme || 'dark'; 

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

        let backgroundGradient, textColor;
        if (theme === 'light') {
            backgroundGradient = ctx.createLinearGradient(0, 0, 250, 100);
            backgroundGradient.addColorStop(0, '#ffffff');
            backgroundGradient.addColorStop(1, '#e4e4e4');
            textColor = '#000';
        } else {
            backgroundGradient = ctx.createLinearGradient(0, 0, 250, 100);
            backgroundGradient.addColorStop(0, '#1e2a38'); 
            backgroundGradient.addColorStop(1, '#15202B');
            textColor = '#fff'; 
        }

        ctx.fillStyle = backgroundGradient;
        drawRoundedRect(ctx, 0, 0, 250, 100, 15);
        const profilePicSize = 80;
        const profilePicX = 10;
        const profilePicY = 50;

        ctx.save();
        ctx.beginPath();
        ctx.arc(profilePicX + profilePicSize / 2, profilePicY, profilePicSize / 2 + 4, 0, Math.PI * 2); 

        ctx.save();
        ctx.beginPath();
        ctx.arc(profilePicX + profilePicSize / 2, profilePicY, profilePicSize / 2, 0, Math.PI * 2);
        ctx.clip();
        const imgObj = await loadImage(imgBuffer);
        ctx.drawImage(imgObj, profilePicX, profilePicY - profilePicSize / 2, profilePicSize, profilePicSize);
        ctx.restore();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 19px Montserrat';
        ctx.textAlign = 'left';
        ctx.shadowColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        ctx.fillText(user.displayName, profilePicX + profilePicSize + 15, profilePicY - 15);
        ctx.shadowColor = 'transparent';


        const statusBuffer = fs.readFileSync(`${__dirname}/status/${user.status}.png`);

        const statusObj = await loadImage(statusBuffer);
        const maxStatusSize = 25;
        const statusWidth = statusObj.width;
        const statusHeight = statusObj.height;
        const statusAspectRatio = statusWidth / statusHeight;

        let statusDrawWidth = maxStatusSize;
        let statusDrawHeight = maxStatusSize;

        if (statusWidth > statusHeight) {
            statusDrawHeight = maxstatusSize / statusAspectRatio;
        } else {
            statusDrawWidth = maxStatusSize * statusAspectRatio;
        }

        ctx.beginPath();
        ctx.arc(profilePicX + profilePicSize - 10.5, 100 - statusDrawHeight + 2.5, 13, 0, Math.PI * 2, true); 
        ctx.fillStyle = 'white';
        ctx.fill();

        const statusX = profilePicX + profilePicSize - 23; 
        const statusY = 100 - statusDrawHeight - 10; 

        ctx.drawImage(statusObj, statusX, statusY, statusDrawWidth, statusDrawHeight);

        ctx.font = 'bold 12px Montserrat';
        ctx.fillStyle = `#737E8D`;
        ctx.fillText(`@${user.globalName}`, profilePicX + profilePicSize + 15, profilePicY + 5);

        const logoObj = await loadImage(logoBuffer);

        const maxLogoSize = 20;

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

        const logoX = 250 - logoDrawWidth - 15; 
        const logoY = 100 - logoDrawHeight - 10; 

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
