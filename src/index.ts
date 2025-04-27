import express from "express";
import { RequestHandler } from "express";
import { handleGoogleDriveRequest } from "./services/google-drive/index.js";

const app = express();

// MCP requires raw JSON string → use express.text()
app.use(express.text({ type: "application/json" }));

// ---- Routes -------------------------------------------------------
app.post("/google-drive", handleGoogleDriveRequest);

// ---- Health‑check -------------------------------------------------
app.get("/healthz", ((_req, res) => {
	res.send("ok");
}) as RequestHandler);

const PORT = 8080;
app.listen(PORT, () => console.error(`MCP multi‑service host listening on :${PORT}`));
