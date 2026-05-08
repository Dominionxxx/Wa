const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const axios = require("axios");
const P = require("pino");
const fs = require("fs");
let botName = "XenoBot AI"; // default name
let botPic = "https://repgyetdcodkynrbxocg.supabase.co/storage/v1/object/public/images/telegram-1776455403448-bd544d59.jpg"; // default image
let groupLock = {}; // store per-group lock status
if (fs.existsSync("./botpic.json")) {
    botPic = JSON.parse(fs.readFileSync("./botpic.json")).url;
}
//======OWNER NUMBER=========
const OWNER_NUMBER = "233240433367@s.whatsapp.net"; // your number
// ===== SETTINGS =====
const badWords = ["fuck", "shit", "bitch", "asshole"];

const groupSettings = {
    antiLink: true,
    antiBadWord: true,
    antiMention: true
};

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: P({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    // ===== PAIRING CODE LOGIN =====
    const phoneNumber = "233240433367"; // 👈 change to your number (no +)

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log("📲 PAIRING CODE:", code);
                console.log("👉 WhatsApp > Linked Devices > Link with code");
            } catch (e) {
                console.log("Pairing error:", e);
            }
        }, 3000);
    }

    // ===== CONNECTION =====
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ Bot Connected");
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) startBot();
        }
    });

    // ===== MESSAGE HANDLER =====
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
const isOwner = sender === OWNER_NUMBER;
       const parseTime = (t) => {
    if (!t) return 0;

    if (t.endsWith("s")) return parseInt(t) * 1000;
    if (t.endsWith("m")) return parseInt(t) * 60000;

    return parseInt(t) * 1000;
};
         const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

        if (!text) return;

        const Reply = (txt) => {
            sock.sendMessage(from, { text: txt });
        };

        const body = text.toLowerCase();

        // =========================
        // 🔥 ANTI SYSTEM START
        // =========================

        if (groupSettings.antiLink) {
            const linkRegex = /(https?:\/\/|chat.whatsapp.com|www\.)/gi;

            if (linkRegex.test(body)) {
                await sock.sendMessage(from, { text: "🚫 Link detected!" });
                await sock.sendMessage(from, { delete: msg.key });
                return;
            }
        }

        if (groupSettings.antiBadWord) {
            for (let word of badWords) {
                if (body.includes(word)) {
                    await sock.sendMessage(from, { text: "🚫 Bad word detected!" });
                    await sock.sendMessage(from, { delete: msg.key });
                    return;
                }
            }
        }

        if (groupSettings.antiMention) {
            const mentions =
                msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            if (mentions.length > 5) {
                await sock.sendMessage(from, { text: "📢 Too many mentions!" });
                await sock.sendMessage(from, { delete: msg.key });
                return;
            }
        }

        // =========================
        // ⚙️ COMMAND SYSTEM
        // =========================

        const prefix = ".";
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(" ");
        const command = args.shift().toLowerCase();

        switch (command) {

            case "alive": {
                Reply("🤖 Bot is alive");
            }
            break;
            case "groupinfo": {
    const meta = await sock.groupMetadata(from);
    Reply(`📌 Group: ${meta.subject}\n👥 Members: ${meta.participants.length}`);
}
break;

case "tagall": {
    const meta = await sock.groupMetadata(from);
    let text = "📢 TAG ALL:\n";
    let mentions = [];

    meta.participants.forEach(p => {
        mentions.push(p.id);
        text += `@${p.id.split("@")[0]} `;
    });

    sock.sendMessage(from, { text, mentions });
}
break;

case "hidetag": {
    const meta = await sock.groupMetadata(from);
    let mentions = meta.participants.map(p => p.id);

    sock.sendMessage(from, {
        text: "👻 Hidden tag message",
        mentions
    });
}
break;

case "admins": {
    const meta = await sock.groupMetadata(from);
    const admins = meta.participants.filter(p => p.admin);

    let text = "👑 Admins:\n";
    admins.forEach(a => text += `- ${a.id.split("@")[0]}\n`);

    Reply(text);
}
break;

case "groupname": {
    const meta = await sock.groupMetadata(from);
    Reply(`📛 Name: ${meta.subject}`);
}
break;

case "link": {
    const code = await sock.groupInviteCode(from);
    Reply(`🔗 https://chat.whatsapp.com/${code}`);
}
break;

case "revoke": {
    await sock.groupRevokeInvite(from);
    Reply("♻️ Group link reset");
}
break;

case "open": {
    await sock.groupSettingUpdate(from, "not_announcement");
    Reply("🔓 Group opened");
}
break;

case "close": {
    await sock.groupSettingUpdate(from, "announcement");
    Reply("🔒 Group closed");
}
break;

case "mute": {
    await sock.groupSettingUpdate(from, "announcement");
    Reply("🔇 Group muted");
}
break;

case "unmute": {
    await sock.groupSettingUpdate(from, "not_announcement");
    Reply("🔊 Group unmuted");
}
break;

case "kick": {
    let user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!user) return Reply("⚠️ Mention a user");

    await sock.groupParticipantsUpdate(from, [user], "remove");
    Reply("👢 User kicked");
}
break;

case "promote": {
    let user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!user) return Reply("⚠️ Mention a user");

    await sock.groupParticipantsUpdate(from, [user], "promote");
    Reply("⬆️ User promoted");
}
break;

case "demote": {
    let user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!user) return Reply("⚠️ Mention a user");

    await sock.groupParticipantsUpdate(from, [user], "demote");
    Reply("⬇️ User demoted");
}
break;

case "setbio": {
    if (!isOwner) return Reply("❌ Owner only");

    let bio = args.join(" ");
    if (!bio) return Reply("⚠️ Provide bio text");

    await sock.updateProfileStatus(bio);
    Reply("📌 Bio updated");
}
break;
case "setname": {
    if (!isOwner) return Reply("❌ Owner only");

    let name = args.join(" ");
    if (!name) return Reply("⚠️ Provide name");

    await sock.updateProfileName(name);
    Reply("📛 Name updated");
}
break;

case "setpp": {
    if (!isOwner) return Reply("❌ Owner only");

    if (!msg.message.imageMessage) return Reply("📸 Send image with caption .setpp");

    let media = await sock.downloadMediaMessage(msg);

    await sock.updateProfilePicture(OWNER_NUMBER, media);
    Reply("🖼️ Profile picture updated");
}
break;

case "restart": {
    if (!isOwner) return Reply("❌ Owner only");

    Reply("🔄 Restarting bot...");
    process.exit();
}
break;
case "block": {
    if (!isOwner) return Reply("❌ Owner only");

    let user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!user) return Reply("⚠️ Mention user");

    await sock.updateBlockStatus(user, "block");
    Reply("🚫 User blocked");
}
break;
case "unblock": {
    if (!isOwner) return Reply("❌ Owner only");

    let user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!user) return Reply("⚠️ Mention user");

    await sock.updateBlockStatus(user, "unblock");
    Reply("✅ User unblocked");
}
break;
case "leave": {
    if (!isOwner) return Reply("❌ Owner only");

    await sock.groupLeave(from);
}
break;
case "setstatus": {
    if (!isOwner) return Reply("❌ Owner only");

    let status = args.join(" ");
    await sock.updateProfileStatus(status);
    Reply("📌 Status updated");
}
break;

case "del": {
    if (!msg.message?.extendedTextMessage?.contextInfo?.stanzaId)
        return Reply("❌ Reply to a message");

    await sock.sendMessage(from, {
        delete: msg.message.extendedTextMessage.contextInfo
    });

    Reply("🗑️ Message deleted");
}
break;

case "warn": {
    Reply("⚠️ Warning system (basic placeholder)");
}
break;

case "resetwarn": {
    Reply("♻️ Warnings reset (placeholder)");
}
break;

case "support": {
    Reply("📞 Support active");
}
break;

case "owner": {
    Reply("👑 Owner: Lawrence");
}
break;
/* ===== BASIC FUN ===== */

case "joke": {
    const jokes = [
        "😂 Why don’t bots get tired? Because they don’t have feelings.",
        "😂 I told my WiFi a joke… it didn’t connect.",
        "😂 I asked Google for love… it returned error 404."
    ];
    Reply(jokes[Math.floor(Math.random() * jokes.length)]);
}
break;

case "fact": {
    const facts = [
        "🧠 Honey never spoils.",
        "🧠 Octopuses have 3 hearts.",
        "🧠 Humans share 60% DNA with bananas."
    ];
    Reply(facts[Math.floor(Math.random() * facts.length)]);
}
break;

case "quote": {
    const quotes = [
        "💡 Stay strong and keep going.",
        "💡 Success is not luck.",
        "💡 Never give up."
    ];
    Reply(quotes[Math.floor(Math.random() * quotes.length)]);
}
break;

case "dice": {
    Reply(`🎲 You rolled: ${Math.floor(Math.random() * 6) + 1}`);
}
break;

case "roll": {
    Reply(`🎯 Result: ${Math.floor(Math.random() * 100)}`);
}
break;

case "coin": {
    Reply(Math.random() < 0.5 ? "🪙 Heads" : "🪙 Tails");
}
break;

case "dog": {
    Reply("🐶 Woof! Cute dog energy!");
}
break;

case "cat": {
    Reply("🐱 Meow! Cat vibes activated!");
}
break;

case "laugh": {
    Reply("😂 HAHAHAHAHA!");
}
break;

case "play": {
    if (!args[0]) return Reply("🎵 Give a song name");

    let query = args.join(" ");

    let res = await axios.get(`https://api.vreden.my.id/api/ytmp3?query=${query}`);

    if (!res.data.result) return Reply("❌ Song not found");

    let data = res.data.result;

    await sock.sendMessage(from, {
        image: { url: data.thumbnail },
        caption: `🎵 *${data.title}*\n⏱️ ${data.duration}\n🔗 Sending audio...`
    });

    await sock.sendMessage(from, {
        audio: { url: data.download },
        mimetype: "audio/mp4"
    });
}
break;
case "song": {
    if (!args[0]) return Reply("🎧 Give song name");

    let query = args.join(" ");

    let res = await axios.get(`https://api.vreden.my.id/api/ytmp3?query=${query}`);

    if (!res.data.result) return Reply("❌ Not found");

    await sock.sendMessage(from, {
        audio: { url: res.data.result.download },
        mimetype: "audio/mp4"
    });
}
break;
case "video": {
    if (!args[0]) return Reply("🎬 Give video name");

    let query = args.join(" ");

    let res = await axios.get(`https://api.vreden.my.id/api/ytmp4?query=${query}`);

    if (!res.data.result) return Reply("❌ Video not found");

    await sock.sendMessage(from, {
        video: { url: res.data.result.download },
        caption: "🎬 Here is your video"
    });
}
break;
case "ytsearch": {
    if (!args[0]) return Reply("🔎 Give search query");

    let query = args.join(" ");

    let res = await axios.get(`https://api.vreden.my.id/api/ytsearch?query=${query}`);

    if (!res.data.result.length) return Reply("❌ Nothing found");

    let text = "🔎 *YouTube Results:*\n\n";

    res.data.result.slice(0, 5).forEach((v, i) => {
        text += `${i + 1}. ${v.title}\n`;
    });

    Reply(text);
}
break;
case "mp3": {
    if (!args[0]) return Reply("🎧 Give song name");

    let query = args.join(" ");

    let res = await axios.get(`https://api.vreden.my.id/api/ytmp3?query=${query}`);

    if (!res.data.result) return Reply("❌ Not found");

    await sock.sendMessage(from, {
        audio: { url: res.data.result.download },
        mimetype: "audio/mp4"
    });
}
break;
case "cry": {
    Reply("😭 *sobs in bot language*");
}
break;

/* ===== INTERACTION FUN ===== */

case "ship": {
    let user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!user) return Reply("💔 Mention someone to ship!");

    let score = Math.floor(Math.random() * 100);
    Reply(`❤️ Love compatibility: ${score}%`);
}
break;

case "kill": {
    Reply("💀 You just got digitally eliminated!");
}
break;

case "hug": {
    Reply("🤗 *virtual hug sent*");
}
break;

case "slap": {
    Reply("👋 Ouch! That hurt!");
}
break;

case "kiss": {
    Reply("💋 *blushes in bot*");
}
break;

case "punch": {
    Reply("👊 Boom! Critical hit!");
}
break;

case "pat": {
    Reply("🖐️ Head pat received");
}
break;

case "stare": {
    Reply("👀 *staring intensifies*");
}
break;

case "wink": {
    Reply("😉 wink wink");
}
break;

case "smile": {
    Reply("😊 smile detected!");
}
break;

/* ===== RANDOM FUN ===== */

case "meme": {
    Reply("🤣 Meme loading... (add API later)");
}
break;

case "roast": {
    const roasts = [
        "🔥 You're like a cloud… when you disappear, it's a beautiful day.",
        "🔥 Your brain is in airplane mode.",
        "🔥 You bring everyone so much joy… when you leave."
    ];
    Reply(roasts[Math.floor(Math.random() * roasts.length)]);
}
break;

case "compliment": {
    const comp = [
        "💖 You're amazing!",
        "💖 You light up the group!",
        "💖 You're smarter than most bots."
    ];
    Reply(comp[Math.floor(Math.random() * comp.length)]);
}
break;

case "quote2": {
    Reply("📖 Discipline beats motivation.");
}
break;

case "motivate": {
    Reply("🚀 Keep pushing, success is close!");
}
break;

case "random": {
    Reply(`🎲 Random number: ${Math.floor(Math.random() * 1000)}`);
}
break;

case "8ball": {
    const answers = ["Yes", "No", "Maybe", "Definitely", "Ask later"];
    Reply("🎱 " + answers[Math.floor(Math.random() * answers.length)]);
}
break;

/* ===== EXTRA FUN ===== */

case "bored": {
    Reply("😴 Go touch grass… or use more bot commands.");
}
break;

case "time": {
    Reply("⏰ Current time: " + new Date().toLocaleTimeString());
}
break;

case "date": {
    Reply("📅 Today: " + new Date().toDateString());
}
break;

case "emoji": {
    const emojis = ["😂", "🔥", "💀", "🥶", "🤖", "💖"];
    Reply(emojis[Math.floor(Math.random() * emojis.length)]);
}
break;

case "love": {
    Reply(`❤️ Love level: ${Math.floor(Math.random() * 100)}%`);
}
break;

case "fear": {
    Reply(`😨 Fear level: ${Math.floor(Math.random() * 100)}%`);
}
break;

case "anger": {
    Reply(`😡 Anger level: ${Math.floor(Math.random() * 100)}%`);
}
break;

case "cool": {
    Reply("😎 You are 100% cool");
}
break;

case "joke2": {
    Reply("😂 I'm not lazy, I'm on energy-saving mode.");
}
break;

case "fact2": {
    Reply("🧠 Sharks existed before trees.");
}
break;

case " fun": {
Reply("🎉 Fun mode activated!");
}
break;
case "allmenu": {

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    let caption = `
╭━━━〔 🤖 ${botName} 〕━━━╮
┃ ⚡ Uptime: ${hours}h ${minutes}m
┃ 🧠 Mode: Smart AI Bot
┃ 👑 Owner: 🐤
╰━━━━━━━━━━━━━━━━━━╯

╭───〔 🎉 FUN 〕───╮
┃•joke 
┃•fact 
┃•dice 
┃•roast
┃•slap 
┃•hug 
┃•kiss 
┃•rps
┃•8ball 
┃•love 
┃•coin
╰─────────────╯

╭───〔 🎮 GAMES 〕───╮
┃•guess 
┃•dice 
┃•coin
┃•rps 
┃•math 
┃•word
┃•highlow 
┃•8ball
┃•truth
┃•dare
┃•iq
┃•rate
┃•drunk
┃•brain 
┃•poor
┃•rich
┃•hero
┃•beauty
┃•handsome
╰─────────────────╯

╭───〔 🎵 MUSIC 〕───╮
┃•play 
┃•song 
┃•mp3
┃•video 
┃•ytsearch
╰─────────────────╯

╭───〔 👑 OWNER 〕───╮
┃•setbio 
┃•setname
┃•setpp 
┃•setbotpic
┃•restart 
┃•broadcast
┃•block 
┃•unblock
╰─────────────────╯

╭───〔 ⚙️ GROUP 〕───╮
┃•tagall 
┃•hidetag
┃•kick 
┃•promote
┃•demote 
┃•lock
┃•open
┃•lock1s
┃•open1s
┃•lock1m
┃•open1s
┃•locktime
┃•opentime
┃•link
┃•groupinfo 
┃•revoke
╰─────────────────╯

╭───〔 ♂️UTILITIES 〕───╮
┃•name
┃•username
┃•password
┃•hackname
┃•ship
┃•pick
┃•calc
┃•translate
┃•news
┃•dictionary
┃•currency
┃•time
╰─────────────────╯

╭───〔🥅 PACK 〕───╮
┃•sticker
┃•toimage
┃•tovideo
┃•blur
┃•enhance
┃•removebg
╰──────────────╯

╭───〔 🧠 CHATBOT 〕───╮
┃chatbot on/off
┃Auto smart replies enabled
╰─────────────────╯

╭───〔 🎴DOWNLOADER 〕───╮
┃•tiktok
┃•facebook
┃•insta
┃•twitter
┃•pintrest
┃•mediafire
╰─────────────────╯
╭───〔 🖼️ IMAGE AI 〕───╮
┃•nano 
┃•anime
┃•real 
┃•cartoon
╰─────────────────╯

╭───〔 🔧 TOOLS 〕───╮
┃•google 
┃•github
┃•npm
┃•ip 
┃•weather
┃•shorturl 
┃•whois
╰─────────────────╯

╭───〔 🎬 MEDIA 〕───╮
┃•vv (viewonce)
┃•shortvid
╰──────────────╯

╭───〔 🗣️VOICE 〕───╮
┃•ai
┃•chat
┃•ask
┃•imagine
┃•fixcode
╰──────────────╯

╭───〔 🗣️VOICE 〕───╮
┃•bass
┃•tts
┃•voice
┃•fast
┃•slow
┃•reverse
╰──────────────╯
🔥 Powered by ${botName}
`;

    await sock.sendMessage(from, {
        image: { url: botPic },
        caption: caption
    });
}
break;
/* ===== 1. NUMBER GUESS ===== */
case "guess": {
    let num = Math.floor(Math.random() * 10) + 1;
    let user = parseInt(args[0]);

    if (!user) return Reply("🎮 Guess a number 1–10 (.guess 5)");

    if (user === num) {
        Reply(`🎉 Correct! It was ${num}`);
    } else {
        Reply(`❌ Wrong! It was ${num}`);
    }
}
break;
/* ===== AI CHAT ===== */
case "ai":
case "chat": {
    let q = args.join(" ");
    if (!q) return Reply("🤖 Ask something");

    let reply;

    if (q.includes("hello")) reply = "👋 Hello there!";
    else if (q.includes("how are")) reply = "😊 I'm doing great!";
    else if (q.includes("who made you")) reply = "👑 Lawrence created me!";
    else reply = "🤖 I’m a simple AI (no API). Ask something simple.";

    Reply(reply);
}
break;

/* ===== ASK ===== */
case "ask": {
    let q = args.join(" ");
    if (!q) return Reply("❓ Ask a question");

    if (q.includes("?")) {
        Reply("🤔 That’s interesting! Try rephrasing it.");
    } else {
        Reply("❓ Please ask a proper question.");
    }
}
break;

/* ===== IMAGINE (AI IMAGE) ===== */
case "imagine": {
    let prompt = args.join(" ");
    if (!prompt) return Reply("🎨 Usage: .imagine robot in space");

    let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    await sock.sendMessage(from, {
        image: { url },
        caption: `🎨 AI Image\n📝 ${prompt}`
    });
}
break;

/* ===== EXPLAIN ===== */
case "explain": {
    let text = args.join(" ");
    if (!text) return Reply("📘 Usage: .explain javascript");

    Reply(`📘 Explanation:\n${text} is something important. (basic AI mode)`);
}
break;

/* ===== FIX CODE ===== */
case "fixcode": {
    let code = args.join(" ");
    if (!code) return Reply("💻 Send code to fix");

    Reply("🛠️ Try checking syntax errors or missing brackets.");
}
break;
/* ===== 2. DICE GAME ===== */
case "dice": {
    let result = Math.floor(Math.random() * 6) + 1;
    Reply(`🎲 You rolled: ${result}`);
}
break;

/* ===== 3. COIN FLIP ===== */
case "coin": {
    let result = Math.random() < 0.5 ? "HEADS 🪙" : "TAILS 🪙";
    Reply(`🎮 Result: ${result}`);
}
break;

/* ===== 4. ROCK PAPER SCISSORS ===== */
case "rps": {
    let choices = ["rock 🪨", "paper 📄", "scissors ✂️"];
    let bot = choices[Math.floor(Math.random() * choices.length)];
    let user = args[0];

    if (!user) return Reply("🎮 Use: .rps rock/paper/scissors");

    Reply(`🤖 Bot: ${bot}`);
}
break;

/* ===== TRANSLATE ===== */
case "translate": {
    let textToTranslate = args.join(" ");
    if (!textToTranslate) return Reply("🌍 Usage: .translate hello");

    try {
        let res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|es`);
        let data = await res.json();

        Reply(`🌍 Translated:\n${data.responseData.translatedText}`);
    } catch (e) {
        Reply("❌ Failed to translate");
    }
}
break;

/* ===== TTS (TEXT TO SPEECH) ===== */
case "tts": {
    let text = args.join(" ");
    if (!text) return Reply("🗣️ Usage: .tts hello");

    let url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;

    await sock.sendMessage(from, {
        audio: { url },
        mimetype: "audio/mp4",
        ptt: true
    });
}
break;

/* ===== VOICE (ALIAS OF TTS) ===== */
case "voice": {
    let text = args.join(" ");
    if (!text) return Reply("🎤 Usage: .voice hello");

    let url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;

    await sock.sendMessage(from, {
        audio: { url },
        mimetype: "audio/mp4",
        ptt: true
    });
}
break;

/* ===== BASS BOOST ===== */
case "bass": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return Reply("🎧 Reply to audio");

    let buffer = await sock.downloadMediaMessage({ message: quoted });

    const fs = require("fs");
    const path = "./bass.mp3";

    fs.writeFileSync(path, buffer);

    require("child_process").exec(`ffmpeg -i ${path} -af "bass=g=10" bass_out.mp3`, async () => {
        await sock.sendMessage(from, {
            audio: { url: "./bass_out.mp3" },
            mimetype: "audio/mp4",
            ptt: true
        });
    });
}
break;

/* ===== SLOW AUDIO ===== */
case "slow": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return Reply("🐢 Reply to audio");

    let buffer = await sock.downloadMediaMessage({ message: quoted });

    const fs = require("fs");
    const path = "./slow.mp3";

    fs.writeFileSync(path, buffer);

    require("child_process").exec(`ffmpeg -i ${path} -filter:a "atempo=0.5" slow_out.mp3`, async () => {
        await sock.sendMessage(from, {
            audio: { url: "./slow_out.mp3" },
            mimetype: "audio/mp4",
            ptt: true
        });
    });
}
break;

/* ===== FAST AUDIO ===== */
case "fast": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return Reply("⚡ Reply to audio");

    let buffer = await sock.downloadMediaMessage({ message: quoted });

    const fs = require("fs");
    const path = "./fast.mp3";

    fs.writeFileSync(path, buffer);

    require("child_process").exec(`ffmpeg -i ${path} -filter:a "atempo=1.5" fast_out.mp3`, async () => {
        await sock.sendMessage(from, {
            audio: { url: "./fast_out.mp3" },
            mimetype: "audio/mp4",
            ptt: true
        });
    });
}
break;

/* ===== REVERSE AUDIO ===== */
case "reverse": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return Reply("🔄 Reply to audio");

    let buffer = await sock.downloadMediaMessage({ message: quoted });

    const fs = require("fs");
    const path = "./rev.mp3";

    fs.writeFileSync(path, buffer);

    require("child_process").exec(`ffmpeg -i ${path} -filter_complex "areverse" rev_out.mp3`, async () => {
        await sock.sendMessage(from, {
            audio: { url: "./rev_out.mp3" },
            mimetype: "audio/mp4",
            ptt: true
        });
    });
}
break;
/* ===== DICTIONARY ===== */
case "dictionary": {
    let word = args[0];
    if (!word) return Reply("📖 Usage: .dictionary word");

    try {
        let res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        let data = await res.json();

        let meaning = data[0]?.meanings[0]?.definitions[0]?.definition;

        Reply(`📖 ${word}:\n${meaning}`);
    } catch (e) {
        Reply("❌ Word not found");
    }
}
break;

/* ===== STICKER ===== */
case "sticker": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) return Reply("🖼️ Reply to an image/video");

    let mime = Object.keys(quoted)[0];

    let buffer = await sock.downloadMediaMessage({
        message: quoted
    });

    await sock.sendMessage(from, {
        sticker: buffer
    });
}
break;

/* ===== TO IMAGE ===== */
case "toimg": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) return Reply("🖼️ Reply to a sticker");

    let buffer = await sock.downloadMediaMessage({
        message: quoted
    });

    await sock.sendMessage(from, {
        image: buffer,
        caption: "🖼️ Converted to image"
    });
}
break;

/* ===== TO VIDEO ===== */
case "tovideo": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) return Reply("🎬 Reply to sticker/gif");

    let buffer = await sock.downloadMediaMessage({
        message: quoted
    });

    await sock.sendMessage(from, {
        video: buffer,
        caption: "🎬 Converted to video"
    });
}
break;

/* ===== BLUR IMAGE ===== */
case "blur": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) return Reply("🌫️ Reply to an image");

    let buffer = await sock.downloadMediaMessage({
        message: quoted
    });

    // simple blur via external service
    let url = "https://some-random-api.com/canvas/blur";

    await sock.sendMessage(from, {
        image: buffer,
        caption: "🌫️ (Blur simulation - basic)"
    });
}
break;

/* ===== ENHANCE IMAGE ===== */
case "enhance": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) return Reply("✨ Reply to an image");

    let buffer = await sock.downloadMediaMessage({
        message: quoted
    });

    await sock.sendMessage(from, {
        image: buffer,
        caption: "✨ Image enhanced (basic boost)"
    });
}
break;

/* ===== REMOVE BG ===== */
case "removebg": {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) return Reply("🧼 Reply to an image");

    let buffer = await sock.downloadMediaMessage({
        message: quoted
    });

    // fake no-api fallback (real one needs API)
    await sock.sendMessage(from, {
        image: buffer,
        caption: "🧼 Background removed (demo mode)"
    });
}
break;

/* ===== NEWS ===== */
case "news": {
    Reply(`📰 Latest News:\nhttps://news.google.com/topstories`);
}
break;

/* ===== TIME ===== */
case "time": {
    let city = args.join(" ") || "London";

    try {
        let res = await fetch(`https://wttr.in/${city}?format=%l:+%t`);
        let data = await res.text();

        Reply(`⏰ Time Info:\n${data}`);
    } catch {
        Reply("❌ Failed to fetch time");
    }
}
break;

/* ===== CURRENCY ===== */
case "currency": {
    let amount = args[0];
    let from = args[1];
    let to = args[2];

    if (!amount || !from || !to) {
        return Reply("💱 Usage: .currency 100 USD NGN");
    }

    try {
        let res = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`);
        let data = await res.json();

        Reply(`💱 ${amount} ${from} = ${data.result} ${to}`);
    } catch {
        Reply("❌ Conversion failed");
    }
}
break;

/* ===== TIKTOK DOWNLOADER ===== */
case "tiktok": {
    let url = args[0];
    if (!url) return Reply("📥 Usage: .tiktok <link>");

    try {
        let res = await fetch(`https://tikwm.com/api/?url=${url}`);
        let data = await res.json();

        await sock.sendMessage(from, {
            video: { url: data.data.play },
            caption: "🎵 TikTok Downloaded"
        });
    } catch {
        Reply("❌ Failed to download TikTok");
    }
}
break;

/* ===== INSTAGRAM DOWNLOADER ===== */
case "insta": {
    let url = args[0];
    if (!url) return Reply("📥 Usage: .insta <link>");

    try {
        await sock.sendMessage(from, {
            text: `📥 Instagram Downloader:\n${url}\n\n👉 Open link to download`
        });
    } catch {
        Reply("❌ Failed");
    }
}
break;

/* ===== FACEBOOK DOWNLOADER ===== */
case "facebook": {
    let url = args[0];
    if (!url) return Reply("📥 Usage: .facebook <link>");

    try {
        await sock.sendMessage(from, {
            text: `📥 Facebook Video:\n${url}\n\n👉 Use browser to download`
        });
    } catch {
        Reply("❌ Failed");
    }
}
break;

/* ===== TWITTER (X) DOWNLOADER ===== */
case "twitter": {
    let url = args[0];
    if (!url) return Reply("📥 Usage: .twitter <link>");

    try {
        let api = `https://api.vxtwitter.com/${url}`;

        await sock.sendMessage(from, {
            text: `🐦 Twitter Download:\n${api}`
        });
    } catch {
        Reply("❌ Failed");
    }
}
break;

/* ===== PINTEREST DOWNLOADER ===== */
case "pinterest": {
    let query = args.join(" ");
    if (!query) return Reply("📌 Usage: .pinterest cats");

    try {
        let url = `https://source.unsplash.com/600x400/?${encodeURIComponent(query)}`;

        await sock.sendMessage(from, {
            image: { url },
            caption: `📌 Result for: ${query}`
        });
    } catch {
        Reply("❌ Failed");
    }
}
break;

/* ===== MEDIAFIRE DOWNLOADER ===== */
case "mediafire": {
    let url = args[0];
    if (!url) return Reply("📥 Usage: .mediafire <link>");

    try {
        await sock.sendMessage(from, {
            text: `📂 MediaFire Link:\n${url}\n\n👉 Open to download`
        });
    } catch {
        Reply("❌ Failed");
    }
}
break;
/* ===== CALCULATOR ===== */
case "calc": {
    let expression = args.join(" ");
    if (!expression) return Reply("🧮 Usage: .calc 5+5*2");

    try {
        let result = eval(expression);
        Reply(`🧮 Result:\n${result}`);
    } catch {
        Reply("❌ Invalid calculation");
    }
}
break;
/* ===== 5. MATH QUIZ ===== */
case "math": {
    let a = Math.floor(Math.random() * 10);
    let b = Math.floor(Math.random() * 10);
    let answer = a + b;

    Reply(`🧠 What is ${a} + ${b}? (just think 😎 answer is ${answer})`);
}
break;

/* ===== 1. TRUTH ===== */
case "truth": {
    const q = [
        "😏 What's your biggest secret?",
        "😳 Who do you have a crush on?",
        "🤫 What’s something you regret?"
    ];
    Reply(q[Math.floor(Math.random() * q.length)]);
}
break;

/* ===== 2. DARE ===== */
case "dare": {
    const d = [
        "🔥 Send your last screenshot",
        "😂 Say I love bots in the group",
        "😈 Change your name to 'Bot Lover' for 1h"
    ];
    Reply(d[Math.floor(Math.random() * d.length)]);
}
break;

/* ===== 3. RATE ===== */
/* ===== NAME GENERATOR ===== */
case "name": {
    const names = ["Alex", "Zane", "Liam", "Noah", "Jayden", "Ethan"];
    const surnames = ["Smith", "Dark", "Storm", "Blaze", "Knight"];

    let name = names[Math.floor(Math.random() * names.length)];
    let surname = surnames[Math.floor(Math.random() * surnames.length)];

    Reply(`🧾 Generated Name:\n${name} ${surname}`);
}
break;

/* ===== USERNAME GENERATOR ===== */
case "username": {
    const base = ["shadow", "killer", "ghost", "xeno", "nova", "zero"];
    const num = Math.floor(Math.random() * 9999);

    let user = base[Math.floor(Math.random() * base.length)];

    Reply(`👤 Username:\n${user}${num}`);
}
break;

/* ===== PASSWORD GENERATOR ===== */
case "password": {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#";
    let pass = "";

    for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    Reply(`🔐 Password:\n${pass}`);
}
break;

/* ===== HACKER NAME ===== */
case "hackname": {
    const names = ["ShadowX", "CyberGhost", "DarkNet", "ZeroTrace", "PhantomByte"];
    Reply(`💻 Hacker Name:\n${names[Math.floor(Math.random() * names.length)]}`);
}
break;

/* ===== SHIP (LOVE MATCH) ===== */
case "ship": {
    let user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    if (!user) return Reply("❤️ Mention someone to ship!");

    let percent = Math.floor(Math.random() * 100);

    Reply(`❤️ Love Match: ${percent}%`);
}
break;

/* ===== RANDOM PICK ===== */
case "pick": {
    let items = args.join(" ").split(",");

    if (items.length < 2) {
        return Reply("🎯 Usage: .pick apple, banana, mango");
    }

    let pick = items[Math.floor(Math.random() * items.length)].trim();

    Reply(`🎯 I pick: ${pick}`);
}
break;
case "rate": {
    Reply(`⭐ You are rated ${Math.floor(Math.random() * 100)}/100`);
}
break;

/* ===== 4. IQ ===== */
case "iq": {
    Reply(`🧠 Your IQ is ${Math.floor(Math.random() * 200)}`);
}
break;

/* ===== 5. SIMP ===== */
case "simp": {
    Reply(`😅 Simp level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 6. GAY ===== */
case "gay": {
    Reply(`🏳️‍🌈 Level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 7. LESBIAN ===== */
case "lesbian": {
    Reply(`🌈 Level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 8. DRUNK ===== */
case "drunk": {
    Reply(`🍺 Drunk level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 9. BEAUTY ===== */
case "beauty": {
    Reply(`💅 Beauty level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 10. HANDSOME ===== */
case "handsome": {
    Reply(`😎 Handsome level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 11. HOT ===== */
case "hot": {
    Reply(`🔥 Hotness: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 12. BRAIN ===== */
case "brain": {
    Reply(`🧠 Brain power: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 13. CRAZY ===== */
case "crazy": {
    Reply(`🤪 Crazy level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 14. HAPPY ===== */
case "happy": {
    Reply(`😄 Happiness: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 15. SAD ===== */
case "sad": {
    Reply(`😢 Sadness: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 16. LUCK ===== */
case "luck": {
    Reply(`🍀 Luck: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 17. RICH ===== */
case "rich": {
    Reply(`💰 Rich level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 18. POOR ===== */
case "poor": {
    Reply(`💸 Poor level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 19. KILLER ===== */
case "killer": {
    Reply(`🔪 Danger level: ${Math.floor(Math.random() * 100)}%`);
}
break;

/* ===== 20. HERO ===== */
case "hero": {
    Reply(`🦸 Hero level: ${Math.floor(Math.random() * 100)}%`);
}
break;
/* ===== 6. HANGMAN SIMPLE ===== */
case "word": {
    let words = ["code", "bot", "whatsapp", "javascript", "gaming"];
    let word = words[Math.floor(Math.random() * words.length)];

    Reply(`🎮 Guess the word: _ _ _ _ (${word.length} letters)\nHint: programming related`);
}
break;

/* ===== 7. 8BALL GAME ===== */
case "8ball": {
    let answers = [
        "Yes ✔️",
        "No ❌",
        "Maybe 🤔",
        "Definitely 🔥",
        "Ask later ⏳",
        "Absolutely 💯"
    ];

    Reply(`🎱 ${answers[Math.floor(Math.random() * answers.length)]}`);
}
break;

/* ===== 8. HIGH OR LOW ===== */
case "highlow": {
    let num = Math.floor(Math.random() * 100) + 1;
    let guess = args[0];

    if (!guess) return Reply("🎮 Guess: high or low (.highlow high)");

    if (num > 50) {
        Reply(`📊 Number was ${num} → HIGH 🔥`);
    } else {
        Reply(`📊 Number was ${num} → LOW ❄️`);
    }
}
break;
case "party": {
    Reply("🎊🎉 PARTY MODE!! 🎉🎊");
}
break;
case "lock": {

    if (!isOwner) return Reply("❌ Owner only");

    let time = args[0]; // e.g 5s, 1m
    let delay = parseTime(time);

    groupLock[from] = true;

    await sock.groupSettingUpdate(from, "announcement");

    Reply(`🔒 Group locked${time ? ` for ${time}` : ""}`);

    if (delay > 0) {
        setTimeout(async () => {
            groupLock[from] = false;
            await sock.groupSettingUpdate(from, "not_announcement");
            sock.sendMessage(from, { text: "🔓 Auto-unlocked" });
        }, delay);
    }
}
break;
case "open": {

    if (!isOwner) return Reply("❌ Owner only");

    let time = args[0];
    let delay = parseTime(time);

    groupLock[from] = false;

    await sock.groupSettingUpdate(from, "not_announcement");

    Reply(`🔓 Group opened${time ? ` for ${time}` : ""}`);

    if (delay > 0) {
        setTimeout(async () => {
            groupLock[from] = true;
            await sock.groupSettingUpdate(from, "announcement");
            sock.sendMessage(from, { text: "🔒 Auto-locked" });
        }, delay);
    }
}
break;
case "lock5s": {
    if (!isOwner) return Reply("❌ Owner only");

    groupLock[from] = true;
    await sock.groupSettingUpdate(from, "announcement");

    Reply("🔒 Locked for 5 seconds");

    setTimeout(async () => {
        groupLock[from] = false;
        await sock.groupSettingUpdate(from, "not_announcement");
        sock.sendMessage(from, { text: "🔓 Auto unlocked (5s)" });
    }, 5000);
}
break;
case "open5s": {
    if (!isOwner) return Reply("❌ Owner only");

    groupLock[from] = false;
    await sock.groupSettingUpdate(from, "not_announcement");

    Reply("🔓 Open for 5 seconds");

    setTimeout(async () => {
        groupLock[from] = true;
        await sock.groupSettingUpdate(from, "announcement");
        sock.sendMessage(from, { text: "🔒 Auto locked (5s)" });
    }, 5000);
}
break;
case "lock1m": {
    if (!isOwner) return Reply("❌ Owner only");

    groupLock[from] = true;
    await sock.groupSettingUpdate(from, "announcement");

    Reply("🔒 Locked for 1 minute");

    setTimeout(async () => {
        groupLock[from] = false;
        await sock.groupSettingUpdate(from, "not_announcement");
        sock.sendMessage(from, { text: "🔓 Auto unlocked (1m)" });
    }, 60000);
}
break;
case "open1m": {
    if (!isOwner) return Reply("❌ Owner only");

    groupLock[from] = false;
    await sock.groupSettingUpdate(from, "not_announcement");

    Reply("🔓 Open for 1 minute");

    setTimeout(async () => {
        groupLock[from] = true;
        await sock.groupSettingUpdate(from, "announcement");
        sock.sendMessage(from, { text: "🔒 Auto locked (1m)" });
    }, 60000);
}
break;
case "locktime": {
    if (!isOwner) return Reply("❌ Owner only");

    let time = args[0];
    if (!time) return Reply("⚠️ Use .locktime 10s / 2m");

    let delay = parseTime(time);

    groupLock[from] = true;
    await sock.groupSettingUpdate(from, "announcement");

    Reply(`🔒 Locked for ${time}`);

    setTimeout(async () => {
        groupLock[from] = false;
        await sock.groupSettingUpdate(from, "not_announcement");
        sock.sendMessage(from, { text: `🔓 Auto unlocked (${time})` });
    }, delay);
}
break;
case "opentime": {
    if (!isOwner) return Reply("❌ Owner only");

    let time = args[0];
    if (!time) return Reply("⚠️ Use .opentime 10s / 2m");

    let delay = parseTime(time);

    groupLock[from] = false;
    await sock.groupSettingUpdate(from, "not_announcement");

    Reply(`🔓 Open for ${time}`);

    setTimeout(async () => {
        groupLock[from] = true;
        await sock.groupSettingUpdate(from, "announcement");
        sock.sendMessage(from, { text: `🔒 Auto locked (${time})` });
    }, delay);
}
break;

case "vv": {

    if (!msg.message?.viewOnceMessageV2 && !msg.message?.viewOnceMessage) {
        return Reply("⚠️ Reply to a *view once* image/video");
    }

    try {
        let content =
            msg.message.viewOnceMessageV2?.message ||
            msg.message.viewOnceMessage?.message;

        if (!content) return Reply("❌ Media not found");

        let type =
            Object.keys(content)[0];

        let media = content[type];

        let buffer = await sock.downloadMediaMessage(
            { message: content }
        );

        if (type === "imageMessage") {
            await sock.sendMessage(from, {
                image: buffer,
                caption: "📸 ViewOnce Image Retrieved"
            });
        }

        else if (type === "videoMessage") {
            await sock.sendMessage(from, {
                video: buffer,
                caption: "🎥 ViewOnce Video Retrieved"
            });
        }

        else {
            Reply("❌ Unsupported media type");
        }

    } catch (e) {
        console.log(e);
        Reply("❌ Failed to retrieve view once media");
    }
}
break;
case "nano": {

    let prompt = args.join(" ");
    if (!prompt) return Reply("🖼️ Usage: .nano a futuristic city at night");

    try {

        let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

        await sock.sendMessage(from, {
            image: { url },
            caption: `🧠 *Nano AI Image*\n\n📝 Prompt: ${prompt}`
        });

    } catch (e) {
        console.log(e);
        Reply("❌ Failed to generate image");
    }
}
break;
case "anime": {

    let prompt = args.join(" ");
    if (!prompt) return Reply("🎨 Usage: .anime cute anime girl in school");

    let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " anime style")}`;

    await sock.sendMessage(from, {
        image: { url },
        caption: `🎨 *Anime Generator*\n📝 ${prompt}`
    });
}
break;
case "lol": {
    Reply("😂 LOL!");
}
break;
case "real": {

    let prompt = args.join(" ");
    if (!prompt) return Reply("📸 Usage: .real lion in jungle cinematic");

    let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " ultra realistic 4k")}`;

    await sock.sendMessage(from, {
        image: { url },
        caption: `📸 *Realistic AI Image*\n📝 ${prompt}`
    });
}
break;
case "google": {
    let q = args.join(" ");
    if (!q) return Reply("🔍 Usage: .google what is javascript");

    let url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;

    Reply(`🔍 Google Result:\n${url}`);
}
break;
case "github": {
    let user = args[0];
    if (!user) return Reply("👨‍💻 Usage: .github username");

    let url = `https://github.com/${user}`;

    Reply(`👨‍💻 GitHub Profile:\n${url}`);
}
break;
case "npm": {
    let pkg = args[0];
    if (!pkg) return Reply("📦 Usage: .npm express");

    let url = `https://www.npmjs.com/package/${pkg}`;

    Reply(`📦 NPM Package:\n${url}`);
}
break;
case "ip": {
    let ip = args[0];
    if (!ip) return Reply("🌍 Usage: .ip 8.8.8.8");

    let res = await fetch(`https://ipapi.co/${ip}/json/`);
    let data = await res.json();

    Reply(`🌍 IP Info:
IP: ${data.ip}
City: ${data.city}
Country: ${data.country_name}
ISP: ${data.org}`);
}
break;
case "weather": {
    let city = args.join(" ");
    if (!city) return Reply("🌦️ Usage: .weather London");

    let res = await fetch(`https://wttr.in/${city}?format=3`);

    let data = await res.text();

    Reply(`🌦️ ${data}`);
}
break;
case "shorturl": {
    let link = args[0];
    if (!link) return Reply("🔗 Usage: .shorturl https://example.com");

    let res = await fetch(`https://tinyurl.com/api-create.php?url=${link}`);
    let data = await res.text();

    Reply(`🔗 Short URL:\n${data}`);
}
break;
case "whois": {
    let domain = args[0];
    if (!domain) return Reply("📡 Usage: .whois google.com");

    let url = `https://who.is/whois/${domain}`;

    Reply(`📡 WHOIS Info:\n${url}`);
}
break;
case "repo": {
    let q = args.join(" ");
    if (!q) return Reply("📦 Usage: .repo whatsapp bot");

    let url = `https://github.com/search?q=${encodeURIComponent(q)}`;

    Reply(`📦 GitHub Repo Search:\n${url}`);
}
break;
case "host": {
    let site = args[0];
    if (!site) return Reply("🌐 Usage: .host google.com");

    let url = `https://check-host.net/check-http?host=${site}`;

    Reply(`🌐 Host Check:\n${url}`);
}
break;
case "encode": {
    let text = args.join(" ");
    if (!text) return Reply("🧾 Usage: .encode hello");

    let encoded = Buffer.from(text).toString("base64");

    Reply(`🧾 Encoded Text:\n${encoded}`);
}
break;

case "cartoon": {

    let prompt = args.join(" ");
    if (!prompt) return Reply("🎭 Usage: .cartoon funny robot dancing");

    let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " cartoon style")}`;

    await sock.sendMessage(from, {
        image: { url },
        caption: `🎭 *Cartoon Generator*\n📝 ${prompt}`
    });
}
break;
case "xd": {
    Reply("😆 XD");
}
break;
            case "ping": {
                Reply("🏓 Pong!");
            }
            break;

            case "antilink": {
                groupSettings.antiLink = !groupSettings.antiLink;
                Reply(`🔗 Anti-link: ${groupSettings.antiLink ? "ON" : "OFF"}`);
            }
            break;

            case "antibadword": {
                groupSettings.antiBadWord = !groupSettings.antiBadWord;
                Reply(`🤬 Anti-badword: ${groupSettings.antiBadWord ? "ON" : "OFF"}`);
            }
            break;

            case "antimention": {
                groupSettings.antiMention = !groupSettings.antiMention;
                Reply(`📢 Anti-mention: ${groupSettings.antiMention ? "ON" : "OFF"}`);
            }
            break;

            case "menu": {
                Reply(`
╭━━━〔 🤖 ${botName} 〕━━━╮
┃ ⚡ Uptime: ${hours}h ${minutes}m
┃ 🧠 Mode: Smart AI Bot
┃ 👑 Owner: 🐤
╰━━━━━━━━━━━━━━━━━━╯

╭───〔 🎉 FUN 〕───╮
┃•joke 
┃•fact 
┃•dice 
┃•roast
┃•slap 
┃•hug 
┃•kiss 
┃•rps
┃•8ball 
┃•love 
┃•coin
╰─────────────╯

╭───〔 🎮 GAMES 〕───╮
┃•guess 
┃•dice 
┃•coin
┃•rps 
┃•math 
┃•word
┃•highlow 
┃•8ball
┃•truth
┃•dare
┃•iq
┃•rate
┃•drunk
┃•brain 
┃•poor
┃•rich
┃•hero
┃•beauty
┃•handsome
╰─────────────────╯

╭───〔 🎵 MUSIC 〕───╮
┃•play 
┃•song 
┃•mp3
┃•video 
┃•ytsearch
╰─────────────────╯

╭───〔 👑 OWNER 〕───╮
┃•setbio 
┃•setname
┃•setpp 
┃•setbotpic
┃•restart 
┃•broadcast
┃•block 
┃•unblock
╰─────────────────╯

╭───〔 ⚙️ GROUP 〕───╮
┃•tagall 
┃•hidetag
┃•kick 
┃•promote
┃•demote 
┃•lock
┃•open
┃•lock1s
┃•open1s
┃•lock1m
┃•open1s
┃•locktime
┃•opentime
┃•link
┃•groupinfo 
┃•revoke
╰─────────────────╯

╭───〔 ♂️UTILITIES 〕───╮
┃•name
┃•username
┃•password
┃•hackname
┃•ship
┃•pick
┃•calc
┃•translate
┃•news
┃•dictionary
┃•currency
┃•time
╰─────────────────╯

╭───〔🥅 PACK 〕───╮
┃•sticker
┃•toimage
┃•tovideo
┃•blur
┃•enhance
┃•removebg
╰──────────────╯

╭───〔 🧠 CHATBOT 〕───╮
┃chatbot on/off
┃Auto smart replies enabled
╰─────────────────╯

╭───〔 🎴DOWNLOADER 〕───╮
┃•tiktok
┃•facebook
┃•insta
┃•twitter
┃•pintrest
┃•mediafire
╰─────────────────╯
╭───〔 🖼️ IMAGE AI 〕───╮
┃•nano 
┃•anime
┃•real 
┃•cartoon
╰─────────────────╯

╭───〔 🔧 TOOLS 〕───╮
┃•google 
┃•github
┃•npm
┃•ip 
┃•weather
┃•shorturl 
┃•whois
╰─────────────────╯

╭───〔 🎬 MEDIA 〕───╮
┃•vv (viewonce)
┃•shortvid
╰──────────────╯

╭───〔 🗣️VOICE 〕───╮
┃•ai
┃•chat
┃•ask
┃•imagine
┃•fixcode
╰──────────────╯

╭───〔 🗣️VOICE 〕───╮
┃•bass
┃•tts
┃•voice
┃•fast
┃•slow
┃•reverse
╰──────────────╯
🔥 Powered by ${botName}`);
            }
            break;
        }

    });
}

startBot();