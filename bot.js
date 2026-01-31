require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
app.use(express.json());
app.use(cookieParser());
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let readyPromiseResolve;
let readyPromiseReject;
let readyPromise = new Promise((resolve, reject) => {
  readyPromiseResolve = resolve;
  readyPromiseReject = reject;
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  readyPromiseResolve();
});

client.login(process.env.TOKEN).catch(error => {
  console.error("Failed to login:", error);
  readyPromiseReject(error);
});

/* API */
app.get("/api/emojis", async (_, res) => {
  try {
    await readyPromise; // Wait for bot to be ready
    const emojis = await client.application.emojis.fetch();
    res.json([...emojis.values()].map(e => ({
      id: e.id,
      name: e.name,
      animated: e.animated,
      url: e.url
    })));
  } catch (error) {
    console.error("Error fetching emojis:", error);
    res.status(500).json({ error: "Failed to fetch emojis. Bot may not be ready or there was an internal error: " + error.message });
  }
});

app.post("/api/send", async (req, res) => {
  try {
    await readyPromise; // Wait for bot to be ready
    const { channelId, emoji } = req.body;
    const ch = await client.channels.fetch(channelId);
    await ch.send(emoji);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error sending emoji:", error);
    res.json({ ok: false, error: error.message });
  }
});

/* UI Dashboard */
app.get("/", (_, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Emoji Dashboard</title>
<style>
* { box-sizing:border-box; }
html, body{
  margin:0;
  height:100%;
  font-family:Inter,system-ui;
  color:#e5e7eb;
  background: #000;
}
/* Background */
.bg{
  height:100%;
  --w:80px;
  --bg:black;
  --first:#222;
  --second:#333;
  background:
    radial-gradient(circle at right,var(--first) 10% 35%,var(--second) 30% 36%,transparent 30%),
    radial-gradient(circle at left,var(--first) 15% 35%,var(--second) 3% 45%,transparent 30%)
    var(--bg);
  background-size:var(--w) var(--w);
  padding: 20px;
}
/* Header / Input container spacing */
header{
  padding:14px 22px;
  display:flex;
  justify-content:flex-start;
  align-items:center;
  gap:20px;
  margin-top: 30px;
  flex-wrap: wrap;
}
/* Uiverse input */
.input__container {
  position: relative;
  background: #f0f0f0;
  padding: 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 15px;
  border: 4px solid #000;
  max-width: 350px;
  transition: all 400ms cubic-bezier(0.23,1,0.32,1);
  transform-style: preserve-3d;
  transform: rotateX(10deg) rotateY(-10deg);
  perspective: 1000px;
  box-shadow: 10px 10px 0 #000;
}
.input__container:hover{
  transform: rotateX(5deg) rotateY(1deg) scale(1.05);
  box-shadow: 25px 25px 0 -5px #e9b50b,25px 25px 0 0 #000;
}
.shadow__input {
  content:"";
  position:absolute;
  width:100%;
  height:100%;
  left:0;
  bottom:0;
  z-index:-1;
  transform: translateZ(-50px);
  background: linear-gradient(45deg, rgba(255,107,107,0.4) 0%, rgba(255,107,107,0.1) 100%);
  filter: blur(20px);
}
.input__button__shadow{
  cursor:pointer;
  border:3px solid #000;
  background:#e9b50b;
  transition: all 400ms cubic-bezier(0.23,1,0.32,1);
  display:flex;
  justify-content:center;
  align-items:center;
  padding:10px;
  transform: translateZ(20px);
  position: relative;
  z-index:3;
  font-weight:bold;
  text-transform:uppercase;
}
.input__button__shadow:hover{
  background:#e9b50b;
  transform:translateZ(10px) translateX(-5px) translateY(-5px);
  box-shadow:5px 5px 0 0 #000;
}
.input__button__shadow svg{
  fill:#000;
  width:25px;
  height:25px;
}
.input__search{
  width:100%;
  outline:none;
  border:3px solid #000;
  padding:15px;
  font-size:18px;
  background:#fff;
  color:#000;
  transform: translateZ(10px);
  transition: all 400ms cubic-bezier(0.23,1,0.32,1);
  position: relative;
  z-index:3;
  font-family:"Roboto", Arial, sans-serif;
  letter-spacing:-0.5px;
}
.input__search::placeholder{
  color:#666;
  font-weight:bold;
  text-transform:uppercase;
}
.input__search:hover,
.input__search:focus{
  background:#f0f0f0;
  transform: translateZ(20px) translateX(-5px) translateY(-5px);
  box-shadow:5px 5px 0 0 #000;
}
.input__container::before{
  content:"CHANNEL ID";
  position:absolute;
  top:-15px;
  left:20px;
  background:#e9b50b;
  color:#000;
  font-weight:bold;
  padding:5px 10px;
  font-size:14px;
  transform:translateZ(50px);
  z-index:4;
  border:2px solid #000;
}
/* Grid */
#grid{
  padding: 18px;
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
  gap:14px;
  margin-top: 30px;
}
/* Card */
.card{
  height:70px;
  padding:10px 12px;
  background:rgba(0,0,0,.65);
  border:1px solid #1f2937;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}
.emoji{ width:36px; height:36px; }
/* Button */
.button{
  --main-color: rgb(46,213,115);
  --main-bg-color: rgba(46,213,116,.36);
  --pattern-color: rgba(46,213,116,.073);
  cursor:pointer;
  text-transform:uppercase;
  letter-spacing:.25rem;
  font-weight:700;
  font-size:.75rem;
  background:
    radial-gradient(circle,var(--main-bg-color) 0%,rgba(0,0,0,0) 95%),
    linear-gradient(var(--pattern-color) 1px,transparent 1px),
    linear-gradient(to right,var(--pattern-color) 1px,transparent 1px);
  background-size:cover,15px 15px,15px 15px;
  border-image:radial-gradient(circle,var(--main-color) 0%,rgba(0,0,0,0) 100%) 1;
  border-width:1px 0;
  color:var(--main-color);
  padding:6px 16px;
  outline:none;
  transition:.15s ease;
}
.button:hover{ background-size:cover,10px 10px,10px 10px; }
.button:active{ filter:hue-rotate(250deg); transform:scale(.94); }
/* Tick */
.tick{ width:28px; display:flex; justify-content:center; opacity:0; transform:scale(.5); transition:.25s ease; }
.tick.show{ opacity:1; transform:scale(1); }
.checkmark{ width:1.4em; height:1.4em; border:2px solid #32cd32; border-radius:4px; transform:rotate(45deg); border-top-color:transparent; border-left-color:transparent; }
</style>
</head>
<body>
<div class="bg">
<header>
  <!-- Input container -->
  <div class="input__container">
    <div class="shadow__input"></div>
    <button class="input__button__shadow">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000" width="20px" height="20px">
        <path d="M0 0h24v24H0z" fill="none"></path>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
      </svg>
    </button>
    <input type="text" class="input__search" placeholder="Enter channel ID" id="channel">
  </div>
</header>
<div id="grid"></div>
</div>
<script>
const grid=document.getElementById("grid");
const channel=document.getElementById("channel");
// Emoji grid
fetch("/api/emojis").then(r=>r.json()).then(list=>{
  if (list.error) {
    alert(list.error);
    return;
  }
  list.forEach(e=>{
    const card=document.createElement("div");
    card.className="card";
    const img=document.createElement("img");
    img.src=e.url;
    img.className="emoji";
    const btn=document.createElement("button");
    btn.className="button";
    btn.textContent="SEND";
    const tick=document.createElement("div");
    tick.className="tick";
    tick.innerHTML='<div class="checkmark"></div>';
    btn.onclick=()=>{
      fetch("/api/send",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          channelId:channel.value,
          emoji:\`<\${e.animated?"a":""}:\${e.name}:\${e.id}>\`
        })
      }).then(r=>r.json()).then(data=>{
        if (!data.ok) {
          alert(data.error || "Failed to send emoji");
          return;
        }
        btn.style.display="none";
        tick.classList.add("show");
        setTimeout(()=>{
          tick.classList.remove("show");
          btn.style.display="inline-block";
        },1300);
      });
    };
    card.append(img,btn,tick);
    grid.appendChild(card);
  });
}).catch(error => {
  alert("Error loading emojis: " + error.message);
});
</script>
</body>
</html>
`);
});

app.listen(process.env.PORT || 3000, () => console.log(`🌐 Server listening on port ${process.env.PORT || 3000}`));
