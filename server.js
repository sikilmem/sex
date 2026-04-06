const http = require("http");

const HOST = "0.0.0.0";
const PORT = 8080;

function xorEncrypt(data, key) {
  const dataBytes = Buffer.from(data, "utf-8");
  const keyBytes = Buffer.from(key, "utf-8");
  const encrypted = Buffer.alloc(dataBytes.length);

  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return encrypted.toString("hex");
}

function buildLicensePayload() {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  return {
    status: "success",
    message: "License verified successfully",
    key_level: 1,
    app_name: "vsta",
    app_version: "1.0.0",
    days_left: 365,
    expires_at: "2027-04-06 21:58:54",
    timestamp: now,
  };
}

function parseBody(body) {
  const params = new URLSearchParams(body);
  return Object.fromEntries(params.entries());
}

const server = http.createServer((req, res) => {
  const sendJson = (statusCode, payload) => {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  };

  if (req.method !== "POST") {
    return sendJson(405, { error: "Only POST method is allowed" });
  }

  let rawBody = "";

  req.on("data", (chunk) => {
    rawBody += chunk.toString();
  });

  req.on("end", () => {
    const params = parseBody(rawBody);
    const token = params.token?.trim();

    if (!token) {
      return sendJson(400, { error: "Missing 'token' field in request body" });
    }

    console.log(`[${req.socket.remoteAddress}] Token alındı: ${token}`);

    const licensePayload = buildLicensePayload();
    const licenseJson = JSON.stringify(licensePayload);
    const encryptedHex = xorEncrypt(licenseJson, token);

    sendJson(200, { data: encryptedHex });

    console.log(`[${req.socket.remoteAddress}] Şifreli veri gönderildi (${encryptedHex.length} hex karakter)`);
  });

  req.on("error", (err) => {
    console.error("İstek hatası:", err);
    sendJson(500, { error: "Internal server error" });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Sunucu çalışıyor → http://${HOST}:${PORT}`);
  console.log("Durdurmak için Ctrl+C\n");
});
