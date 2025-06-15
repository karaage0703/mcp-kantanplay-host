import { spawn } from "child_process";
import * as path from "path";

export function startMCPServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverDir = "/Users/karaage/GitHub/mcp-midi-server";
    const serverPath = path.join(serverDir, "kantanplay-midi-server.py");

    const uvProcess = spawn("uv", ["run", "python", serverPath], {
      cwd: serverDir,
      stdio: "inherit",
    });

    uvProcess.on("error", (error) => {
      console.error("Failed to start MCP server:", error);
      reject(error);
    });

    uvProcess.on("spawn", () => {
      console.log("MCP MIDI server started successfully");
      setTimeout(() => resolve(), 2000); // Wait 2 seconds for server to initialize
    });

    uvProcess.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}`));
      }
    });
  });
}
