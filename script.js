const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);
const COLORS = [
  "rgba(91,206,250,",
  "rgba(245,169,184,",
  "rgba(192,132,252,",
  "rgba(168,85,247,",
];
const COUNT = 80;
const particles = Array.from({ length: COUNT }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 1.5 + 0.5,
  vx: (Math.random() - 0.5) * 0.3,
  vy: (Math.random() - 0.5) * 0.3,
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  alpha: Math.random() * 0.4 + 0.1,
}));

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color + p.alpha + ")";
    ctx.fill();
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = W;
    else if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    else if (p.y > H) p.y = 0;
  }

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i],
        b = particles[j];
      const dx = a.x - b.x,
        dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(168,85,247,${0.06 * (1 - dist / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

draw();
const DISCORD_ID = "962311614680412181";
const presence = {
  avatar: document.getElementById("presence-avatar"),
  dot: document.getElementById("presence-dot"),
  name: document.getElementById("presence-name"),
  statusText: document.getElementById("presence-status-text"),
  custom: document.getElementById("presence-custom"),
  spotify: document.getElementById("presence-spotify"),
  activities: document.getElementById("presence-activities"),
};

const STATUS_LABELS = {
  online: "online",
  idle: "idle",
  dnd: "do not disturb",
  offline: "offline",
};

const ACTIVITY_VERBS = {
  0: "playing",
  1: "streaming",
  2: "listening to",
  3: "watching",
  5: "competing in",
};

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

function fmtDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

function avatarUrl(user) {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
  }
  const idx =
    user.discriminator && user.discriminator !== "0"
      ? Number(user.discriminator) % 5
      : Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function activityImage(appId, key) {
  if (!key || !appId) return null;
  if (key.startsWith("mp:external/"))
    return `https://media.discordapp.net/external/${key.slice(12)}`;
  return `https://cdn.discordapp.com/app-assets/${appId}/${key}.png`;
}

function emojiHtml(emoji) {
  if (!emoji) return "";
  if (!emoji.id)
    return `<span class="emoji-fallback">${esc(emoji.name)}</span>`;
  return `<img src="https://cdn.discordapp.com/emojis/${emoji.id}.${
    emoji.animated ? "gif" : "png"
  }?size=32" alt="">`;
}

function renderPresence(data) {
  const user = data.discord_user;
  const status =
    data.discord_status in STATUS_LABELS ? data.discord_status : "offline";
  presence.avatar.src = avatarUrl(user);
  presence.dot.className = `status-dot ${status}`;
  presence.name.textContent =
    user.display_name || user.global_name || user.username;
  presence.statusText.textContent = STATUS_LABELS[status];
  const custom = (data.activities || []).find((a) => a.type === 4);
  if (custom && (custom.state || custom.emoji)) {
    presence.custom.hidden = false;
    presence.custom.innerHTML = `${emojiHtml(custom.emoji)}<span>${esc(
      custom.state,
    )}</span>`;
  } else {
    presence.custom.hidden = true;
    presence.custom.innerHTML = "";
  }

  if (data.listening_to_spotify && data.spotify) {
    const sp = data.spotify;
    const start = sp.timestamps?.start;
    const end = sp.timestamps?.end;
    presence.spotify.hidden = false;
    presence.spotify.href = `https://open.spotify.com/track/${sp.track_id}`;
    presence.spotify.innerHTML = `
      <img class="spotify-art" src="${esc(sp.album_art_url)}" alt="">
      <div class="spotify-meta">
        <div class="spotify-title">${esc(sp.song)}</div>
        <div class="spotify-sub">${esc((sp.artist || "").split("; ").join(", "))}</div>
        ${
          start && end
            ? `<div class="spotify-bar"><span data-bar data-start="${start}" data-end="${end}"></span></div>
               <div class="spotify-times">
                 <span data-start="${start}">0:00</span>
                 <span>${fmtDuration(end - start)}</span>
               </div>`
            : ""
        }
      </div>`;
  } else {
    presence.spotify.hidden = true;
    presence.spotify.innerHTML = "";
  }

  const acts = (data.activities || []).filter(
    (a) => a.type !== 4 && !(data.listening_to_spotify && a.name === "Spotify"),
  );
  presence.activities.innerHTML = acts
    .map((a) => {
      const img = activityImage(a.application_id, a.assets?.large_image);
      const details = [a.details, a.state].filter(Boolean);
      const start = a.timestamps?.start;
      const verb = ACTIVITY_VERBS[a.type] ?? "doing";
      return `
      <div class="activity">
        ${img ? `<img src="${esc(img)}" alt="">` : ""}
        <div class="activity-meta">
          <div class="activity-label">${verb}</div>
          <div class="activity-name">${esc(a.name)}</div>
          ${details
            .map((d) => `<div class="activity-detail">${esc(d)}</div>`)
            .join("")}
          ${
            start
              ? `<div class="activity-time" data-start="${start}">0:00 elapsed</div>`
              : ""
          }
        </div>
      </div>`;
    })
    .join("");
}

setInterval(() => {
  const now = Date.now();
  presence.spotify.querySelectorAll("[data-start]").forEach((el) => {
    const start = Number(el.dataset.start);
    if (!start) return;
    if (el.dataset.end) {
      const end = Number(el.dataset.end);
      el.style.width = `${Math.min(100, ((now - start) / (end - start)) * 100)}%`;
    } else {
      el.textContent = fmtDuration(now - start);
    }
  });
  presence.activities.querySelectorAll("[data-start]").forEach((el) => {
    el.textContent = `${fmtDuration(now - Number(el.dataset.start))} elapsed`;
  });
}, 1000);

let heartbeat;
function connectLanyard() {
  const ws = new WebSocket("wss://api.lanyard.rest/socket");
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.op === 1) {
      clearInterval(heartbeat);
      heartbeat = setInterval(
        () => ws.send(JSON.stringify({ op: 3 })),
        msg.d.heartbeat_interval,
      );
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
    } else if (
      msg.op === 0 &&
      (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")
    ) {
      renderPresence(msg.d);
    }
  };
  ws.onclose = () => {
    clearInterval(heartbeat);
    setTimeout(connectLanyard, 5000);
  };
}

connectLanyard();
const clock = {
  time: document.getElementById("clock-time"),
  sub: document.getElementById("clock-sub"),
  status: document.getElementById("clock-status"),
  dayBar: document.getElementById("clock-day-bar"),
  sun: document.getElementById("clock-sun"),
  moon: document.getElementById("clock-moon"),
};

function tickClock() {
  const now = new Date();
  const t = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Baghdad", //neo: yes.
    hour12: false,
  });
  const [h, m, s] = t.split(":").map(Number);
  const pct = ((h * 3600 + m * 60 + s) / 86400) * 100;
  clock.time.textContent = t;
  clock.sub.textContent =
    now
      .toLocaleDateString("en-GB", {
        timeZone: "Asia/Baghdad",
        weekday: "short",
        day: "numeric",
        month: "short",
      })
      .toLowerCase() + ` · day ${pct.toFixed(1)}% over`;
  clock.dayBar.style.width = `${pct}%`;
  const night = h < 7 || h >= 23;
  clock.sun.hidden = night;
  clock.moon.hidden = !night;
  clock.status.textContent = night
    ? "probably asleep… zzz"
    : h >= 22
      ? "winding down probably"
      : "probably awake :3";
}

tickClock();
setInterval(tickClock, 1000);
