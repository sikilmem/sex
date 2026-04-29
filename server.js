const express = require("express");

const app = express();
const PORT = 8080;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

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
    days_left: 1337,
    expires_at: "2027-04-06 21:58:54",
    timestamp: now,
  };
}

app.post("/apiv2.php", (req, res) => {
  const token = req.body?.token?.trim();

  if (!token) {
    return res.status(400).send("Missing 'token' field in request body");
  }

  const licenseJson = JSON.stringify(buildLicensePayload());
  const encryptedHex = xorEncrypt(licenseJson, token);

  res.setHeader("Content-Type", "text/plain");
  res.send(encryptedHex);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor → http://localhost:${PORT}`);
  });
}

module.exports = app;
