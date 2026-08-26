import express from "express";
import cors from "cors";
import pino from "pino";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const AUTH_DIR = path.join(__dirname, "whatsapp_auth");

app.use(cors());
app.use(express.json());

const logger = pino({ level: "warn" });

let sock = null;
let currentQrDataUrl = null;
let connectionStatus = "disconnected"; // 'disconnected' | 'connecting' | 'connected'
let connectedUser = null;

async function initWhatsApp() {
  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ["Pikud360 Command Center", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: true,
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = "connecting";
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr);
        } catch (err) {
          console.error("QR Code generation error:", err);
        }
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        connectionStatus = "disconnected";
        currentQrDataUrl = null;
        connectedUser = null;

        console.log("Connection closed. Reconnecting:", shouldReconnect);
        if (shouldReconnect) {
          setTimeout(initWhatsApp, 3000);
        }
      } else if (connection === "open") {
        connectionStatus = "connected";
        currentQrDataUrl = null;
        connectedUser = {
          id: sock.user?.id?.split(":")[0] || sock.user?.id,
          name: sock.user?.name || "מפקד יחידה"
        };
        console.log("WhatsApp connected successfully as:", connectedUser);
      }
    });
  } catch (err) {
    console.error("Failed to initialize WhatsApp:", err);
    connectionStatus = "disconnected";
    setTimeout(initWhatsApp, 5000);
  }
}

// Format Phone Number to WhatsApp JID
function formatJid(target) {
  if (!target) return null;
  target = target.trim();

  // Already a JID
  if (target.endsWith("@s.whatsapp.net") || target.endsWith("@g.us")) {
    return target;
  }

  // Israeli phone
  let clean = target.replace(/\D/g, "");
  if (!clean) return null;
  if (clean.startsWith("0")) {
    clean = "972" + clean.substring(1);
  } else if (!clean.startsWith("972")) {
    clean = "972" + clean;
  }
  return `${clean}@s.whatsapp.net`;
}

// Extract Invite code from link
function extractInviteCode(urlOrCode) {
  if (!urlOrCode) return null;
  const match = urlOrCode.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  if (/^[A-Za-z0-9_-]{20,25}$/.test(urlOrCode.trim())) {
    return urlOrCode.trim();
  }
  return null;
}

// ---- API Endpoints ----

// Status
app.get("/api/whatsapp/status", (req, res) => {
  res.json({
    status: connectionStatus,
    qr: currentQrDataUrl,
    user: connectedUser
  });
});

// Logout / Reconnect
app.post("/api/whatsapp/logout", async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (err) {
    console.warn("Logout error:", err);
  }

  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  } catch (err) {
    console.warn("Clean auth dir error:", err);
  }

  connectionStatus = "disconnected";
  currentQrDataUrl = null;
  connectedUser = null;

  setTimeout(initWhatsApp, 1000);
  res.json({ success: true, message: "Logged out. Starting fresh session." });
});

// Send Message
app.post("/api/whatsapp/send", async (req, res) => {
  if (connectionStatus !== "connected" || !sock) {
    return res.status(400).json({
      success: false,
      error: "WhatsApp gateway is not connected. Please scan the QR code."
    });
  }

  const { target, message } = req.body;
  if (!target || !message) {
    return res.status(400).json({ success: false, error: "Target and message are required." });
  }

  try {
    let resolvedJid = null;

    // Check if target is a group invite link
    const inviteCode = extractInviteCode(target);
    if (inviteCode) {
      try {
        const groupInfo = await sock.groupGetInviteInfo(inviteCode);
        resolvedJid = groupInfo?.id;
        if (!resolvedJid) {
          resolvedJid = await sock.groupAcceptInvite(inviteCode);
        }
      } catch (e) {
        console.warn("Could not get group invite info, attempting direct accept:", e);
        try {
          resolvedJid = await sock.groupAcceptInvite(inviteCode);
        } catch (acceptErr) {
          return res.status(400).json({
            success: false,
            error: "Could not resolve or join WhatsApp group from invite link."
          });
        }
      }
    } else {
      resolvedJid = formatJid(target);
    }

    if (!resolvedJid) {
      return res.status(400).json({ success: false, error: "Invalid target phone or group." });
    }

    const sent = await sock.sendMessage(resolvedJid, { text: message });
    res.json({ success: true, messageId: sent?.key?.id, jid: resolvedJid });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to send message." });
  }
});

// Broadcast to Multiple Targets
app.post("/api/whatsapp/broadcast", async (req, res) => {
  if (connectionStatus !== "connected" || !sock) {
    return res.status(400).json({
      success: false,
      error: "WhatsApp gateway is not connected. Please scan the QR code."
    });
  }

  const { targets = [], message, delayMs = 400 } = req.body;
  if (!targets.length || !message) {
    return res.status(400).json({ success: false, error: "Targets list and message are required." });
  }

  const results = { total: targets.length, sent: 0, failed: 0, details: [] };

  for (const target of targets) {
    try {
      let resolvedJid = null;
      const inviteCode = extractInviteCode(target);

      if (inviteCode) {
        try {
          const groupInfo = await sock.groupGetInviteInfo(inviteCode);
          resolvedJid = groupInfo?.id;
          if (!resolvedJid) {
            resolvedJid = await sock.groupAcceptInvite(inviteCode);
          }
        } catch (e) {
          resolvedJid = await sock.groupAcceptInvite(inviteCode).catch(() => null);
        }
      } else {
        resolvedJid = formatJid(target);
      }

      if (resolvedJid) {
        await sock.sendMessage(resolvedJid, { text: message });
        results.sent++;
        results.details.push({ target, status: "sent", jid: resolvedJid });
      } else {
        results.failed++;
        results.details.push({ target, status: "failed", error: "Invalid target" });
      }
    } catch (err) {
      results.failed++;
      results.details.push({ target, status: "failed", error: err.message });
    }

    // Safety throttle delay
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  res.json({ success: true, results });
});

app.listen(PORT, () => {
  console.log(`WhatsApp Gateway Service running on http://localhost:${PORT}`);
  initWhatsApp();
});
