import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";


export async function connectMCP() {
    const client = new Client({
        name: "github-release-assistant",
        version: "1.0.0"
    });

    const token =
        process.env.GITHUB_PERSONAL_ACCESS_TOKEN ??
        process.env.GITHUB_TOKEN;

    if (!token) {
        throw new Error("Missing GitHub token");
    }

    const transport = new StdioClientTransport({
        command: process.env.MCP_SERVER_PATH ?? "./github-mcp-server",
        args: [
            "stdio",
            "--toolsets", "repos,issues,projects"
        ],
        env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: token,
            PATH: process.env.PATH || ""
        }
    });

    const CONNECT_TIMEOUT_MS = 10_000;
    await Promise.race([
        client.connect(transport),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("MCP server connection timed out")), CONNECT_TIMEOUT_MS)
        ),
    ]);

    const response = await client.listTools();
    const toolNames = response.tools.map((t: any) => t.name);
    // console.log("LOCAL TOOLS ACTIVE:", toolNames);

    return client;
}