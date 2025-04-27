import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";
import type { Request, Response } from "express";

let server: Server | null = null;
let transport: StreamableHTTPServerTransport | null = null;

function initServerOnce(): void {
	if (server) return; // already done

	/* --- Build per‑request Drive client --------------------------- */
	function buildDriveClient(headers: {
		"x-access-token"?: string | null;
		"x-refresh-token"?: string | null;
	}) {
		const accessToken = headers["x-access-token"] as string | undefined;
		if (!accessToken) throw new Error("401: x-access-token header required");

		const oauth = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET
		);
		oauth.setCredentials({
			access_token: accessToken,
			refresh_token: headers!["x-refresh-token"] as string | null
		});

		return {
			drive: google.drive({ version: "v3", auth: oauth })
		};
	}

	/* --- Create MCP Server & register handlers -------------------- */
	server = new Server(
		{ name: "mcp-servers/google-drive", version: "0.1.0" },
		{ capabilities: { resources: {}, tools: {} } }
	);

	/* 1) ListResources -------------------------------------------- */
	server.setRequestHandler(ListResourcesRequestSchema, async (req, ctx) => {
		const { drive } = buildDriveClient((ctx as any).headers);
		const params: any = {
			pageSize: 10,
			fields: "nextPageToken, files(id, name, mimeType)"
		};
		if (req.params?.cursor) params.pageToken = req.params.cursor;
		const res = await drive.files.list(params);
		const files = res.data.files || [];
		return {
			resources: files.map((f) => ({
				uri: `gdrive:///${f.id}`,
				mimeType: f.mimeType,
				name: f.name
			})),
			nextCursor: res.data.nextPageToken
		};
	});

	/* 2) ReadResource --------------------------------------------- */
	server.setRequestHandler(ReadResourceRequestSchema, async (req, ctx) => {
		const { drive } = buildDriveClient((ctx as any).headers);
		const fileId = req.params.uri.replace("gdrive:///", "");

		const meta = await drive.files.get({ fileId, fields: "mimeType" });
		const mimeType = meta.data.mimeType || "application/octet-stream";

		// Google Docs family → export
		if (mimeType.startsWith("application/vnd.google-apps")) {
			const exportMap: Record<string, string> = {
				"application/vnd.google-apps.document": "text/markdown",
				"application/vnd.google-apps.spreadsheet": "text/csv",
				"application/vnd.google-apps.presentation": "text/plain",
				"application/vnd.google-apps.drawing": "image/png"
			};
			const exportMime = exportMap[mimeType] || "text/plain";
			const res = await drive.files.export(
				{ fileId, mimeType: exportMime },
				{ responseType: "text" }
			);
			return {
				contents: [{ uri: req.params.uri, mimeType: exportMime, text: res.data as string }]
			};
		}

		// Regular file → download
		const res = await drive.files.get(
			{ fileId, alt: "media" },
			{ responseType: "arraybuffer" }
		);
		if (mimeType.startsWith("text/") || mimeType === "application/json") {
			return {
				contents: [
					{
						uri: req.params.uri,
						mimeType,
						text: Buffer.from(res.data as ArrayBuffer).toString("utf-8")
					}
				]
			};
		}
		return {
			contents: [
				{
					uri: req.params.uri,
					mimeType,
					blob: Buffer.from(res.data as ArrayBuffer).toString("base64")
				}
			]
		};
	});

	/* 3) ListTools ------------------------------------------------- */
	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: [
			{
				name: "search",
				description: "Search for files in Google Drive",
				inputSchema: {
					type: "object",
					properties: { query: { type: "string", description: "Search query" } },
					required: ["query"]
				}
			}
		]
	}));

	/* 4) CallTool: search ----------------------------------------- */
	server.setRequestHandler(CallToolRequestSchema, async (req, ctx) => {
		if (req.params.name !== "search") throw new Error("Tool not found");
		const { drive } = buildDriveClient((ctx as any).headers);
		const userQuery = String(req.params.arguments?.query || "");
		const escaped = userQuery.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
		const res = await drive.files.list({
			q: `fullText contains '${escaped}'`,
			pageSize: 10,
			fields: "files(id, name, mimeType)"
		});
		const list = (res.data.files || []).map((f) => `${f.name} (${f.mimeType})`).join("\n");
		return {
			content: [
				{ type: "text", text: `Found ${res.data.files?.length || 0} files:\n${list}` }
			],
			isError: false
		};
	});

	/* --- Connect Transport --------------------------------------- */
	transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
	server.connect(transport as unknown as Transport).catch((err) => {
		console.error("Google Drive MCP server connect error", err);
	});
}

export async function handleGoogleDriveRequest(req: Request, res: Response) {
	initServerOnce();
	if (!transport) {
		res.status(500).end("transport not initialized");
		return;
	}
	try {
		await transport.handleRequest(req, res, req.body as string);
	} catch (err) {
		console.error("Google Drive handler error", err);
		if (!res.headersSent) res.status(500).end("internal error");
	}
}
