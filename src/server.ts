import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import {
    createCanvas,
    loadImage,
    registerFont,
    CanvasRenderingContext2D,
} from "canvas";
import axios from "axios";
import sharp from "sharp";

const app = express();
const PORT: number = 3002;
const USERS_FILE: string = path.join(__dirname, "users.json");
const LOGO_FILE: string = path.join(__dirname, "/public/Discord-logo.png");

const FONT_PATH: string = path.join(__dirname, "/public/Montserrat-Bold.ttf");
registerFont(FONT_PATH, { family: "Montserrat" });

async function fetchAndConvertImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer: Buffer = Buffer.from(response.data);
    return await sharp(buffer).toFormat("png").toBuffer();
}

function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
): void {
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

app.get("/", (req: Request, res: Response) => {
    const users: Array<{
        id: string;
        avatar: string;
        displayName: string;
        globalName: string;
        status: string;
    }> = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    res.send(`
        <html>
            <head>
                <title>Join Our Server</title>
                <meta property="og:title" content="Fila" />
                <meta property="og:description" content="Tracking your discord profile" />
                <meta property="og:url" content="https://fila.aleu.xyz/" />
                <meta property="og:type" content="website" />
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #f4f4f4;
                        font-family: Arial, sans-serif;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                    }
                    h1 {
                        font-size: 2.5em;
                        color: #333;
                    }
                    p {
                        font-size: 1.2em;
                        color: #555;
                    }
                    a {
                        text-decoration: none;
                        color: #fff;
                        background-color: #7289DA;
                        padding: 10px 20px;
                        border-radius: 5px;
                        font-size: 1.1em;
                        display: inline-block;
                        margin-top: 20px;
                    }
                    .counter {
                        font-size: 2em;
                        color: #7289DA;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Welcome to Fila!</h1>
                    <p>Please join the server to start tracking your activities.</p>
                    <a href="https://discord.gg/rwsHDTcZbe">Join the Server</a>
                    <a href="https://github.com/Aleu0091/Discord-profile-tracker">Github</a>

                    <p class="counter">Tracking <span id="userCount">0</span> users...</p>
                </div>
                <script>
                let userCount = 0;
                const maxUserCount = ${users.length}; 
                const incrementStep = 100; 
                const increment = () => {
                    if (userCount < maxUserCount) {
                        userCount += incrementStep;
                        if (userCount > maxUserCount) {
                            userCount = maxUserCount;
                        }
                        document.getElementById('userCount').textContent = userCount.toLocaleString();
                        requestAnimationFrame(increment);
                    }
                };
                increment();
                </script>
            </body>
        </html>
    `);
});

app.get("/discord/user/:id", async (req: Request, res: Response) => {
    const userId: string = req.params.id;
    const theme = req.query.theme || "dark";

    try {
        const users: Array<{
            id: string;
            avatar: string;
            displayName: string;
            globalName: string;
            status: string;
        }> = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
        const user = users.find((u) => u.id === userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        const imgBuffer: Buffer = await fetchAndConvertImage(user.avatar);
        const logoBuffer: Buffer = fs.readFileSync(LOGO_FILE);

        const canvas = createCanvas(250, 100);
        const ctx = canvas.getContext("2d");

        let backgroundGradient: CanvasGradient;
        let textColor: string;
        if (theme === "light") {
            backgroundGradient = ctx.createLinearGradient(0, 0, 250, 100);
            backgroundGradient.addColorStop(0, "#ffffff");
            backgroundGradient.addColorStop(1, "#e4e4e4");
            textColor = "#000";
        } else {
            backgroundGradient = ctx.createLinearGradient(0, 0, 250, 100);
            backgroundGradient.addColorStop(0, "#1e2a38");
            backgroundGradient.addColorStop(1, "#15202B");
            textColor = "#fff";
        }

        ctx.fillStyle = backgroundGradient;
        drawRoundedRect(ctx, 0, 0, 250, 100, 15);

        const profilePicSize: number = 80;
        const profilePicX: number = 10;
        const profilePicY: number = 50;

        ctx.save();
        ctx.beginPath();
        ctx.arc(
            profilePicX + profilePicSize / 2,
            profilePicY,
            profilePicSize / 2 + 4,
            0,
            Math.PI * 2
        );

        ctx.save();
        ctx.beginPath();
        ctx.arc(
            profilePicX + profilePicSize / 2,
            profilePicY,
            profilePicSize / 2,
            0,
            Math.PI * 2
        );
        ctx.clip();
        const imgObj = await loadImage(imgBuffer);
        ctx.drawImage(
            imgObj,
            profilePicX,
            profilePicY - profilePicSize / 2,
            profilePicSize,
            profilePicSize
        );
        ctx.restore();

        ctx.fillStyle = textColor;
        ctx.font = "bold 19px Montserrat";
        ctx.textAlign = "left";
        ctx.shadowColor =
            theme === "dark"
                ? "rgba(0, 0, 0, 0.5)"
                : "rgba(255, 255, 255, 0.5)";
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        ctx.fillText(
            user.displayName,
            profilePicX + profilePicSize + 15,
            profilePicY - 15
        );
        ctx.shadowColor = "transparent";

        const statusBuffer: Buffer = fs.readFileSync(
            `${__dirname}/public/status/${user.status}.png`
        );
        const statusObj = await loadImage(statusBuffer);
        const maxStatusSize: number = 25;
        const statusWidth: number = statusObj.width;
        const statusHeight: number = statusObj.height;
        const statusAspectRatio: number = statusWidth / statusHeight;

        let statusDrawWidth: number = maxStatusSize;
        let statusDrawHeight: number = maxStatusSize;

        if (statusWidth > statusHeight) {
            statusDrawHeight = maxStatusSize / statusAspectRatio;
        } else {
            statusDrawWidth = maxStatusSize * statusAspectRatio;
        }
        ctx.beginPath();
        ctx.arc(
            profilePicX + profilePicSize - 10.5,
            100 - statusDrawHeight + 2.5,
            13,
            0,
            Math.PI * 2,
            true
        );
        ctx.fillStyle = "white";
        ctx.fill();

        const statusX: number = profilePicX + profilePicSize - 23;
        const statusY: number = 100 - statusDrawHeight - 10;

        ctx.drawImage(
            statusObj,
            statusX,
            statusY,
            statusDrawWidth,
            statusDrawHeight
        );

        ctx.font = "bold 12px Montserrat";
        ctx.fillStyle = `#737E8D`;
        ctx.fillText(
            `@${user.globalName}`,
            profilePicX + profilePicSize + 15,
            profilePicY + 5
        );

        const logoObj = await loadImage(logoBuffer);
        const maxLogoSize: number = 20;

        const logoWidth: number = logoObj.width;
        const logoHeight: number = logoObj.height;
        const aspectRatio: number = logoWidth / logoHeight;

        let logoDrawWidth: number = maxLogoSize;
        let logoDrawHeight: number = maxLogoSize;

        if (logoWidth > logoHeight) {
            logoDrawHeight = maxLogoSize / aspectRatio;
        } else {
            logoDrawWidth = maxLogoSize * aspectRatio;
        }

        const logoX: number = 250 - logoDrawWidth - 15;
        const logoY: number = 100 - logoDrawHeight - 10;

        ctx.drawImage(logoObj, logoX, logoY, logoDrawWidth, logoDrawHeight);

        res.set("Content-Type", "image/png");
        const buffer = canvas.toBuffer("image/png");
        res.set("Content-Type", "image/png");
        res.end(buffer);
    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).send("Internal server error");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
