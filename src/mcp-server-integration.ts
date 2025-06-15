import { MCPClient } from "./mcp-client";

export interface MCPServerConfig {
  serverPath: string;
  serverArgs?: string[];
  pythonServerPath?: string;
}

export class MCPServerIntegration {
  private mcpClient: MCPClient;
  private isConnected: boolean = false;

  constructor(config: MCPServerConfig) {
    // If pythonServerPath is provided, run the Python server directly
    if (config.pythonServerPath) {
      this.mcpClient = new MCPClient(
        "uv",
        ["run", "python", "kantanplay-midi-server.py"],
        config.pythonServerPath,
      );
    } else {
      // Otherwise, use the shell script approach
      const scriptPath = "/Users/karaage/GitHub/mcp-kantanplay-host/start-mcp-server.sh";
      this.mcpClient = new MCPClient(scriptPath, [], config.serverPath);
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.mcpClient.connect();
      this.isConnected = true;
      console.log("Connected to MCP MIDI server");

      const tools = (await this.mcpClient.listTools()) as { name: string; description?: string }[];
      console.log("Available tools:", tools);

      // MIDIポートを開く
      try {
        const openPortResult = (await this.mcpClient.callTool("open_midi_port", {
          port_index: 0,
        })) as { success: boolean; message?: string };
        console.log("MIDI port opened:", openPortResult);
      } catch (error) {
        console.error("Failed to open MIDI port:", error);
      }
    } catch (error) {
      console.error("Failed to connect to MCP server:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.mcpClient.disconnect();
      this.isConnected = false;
      console.log("Disconnected from MCP MIDI server");
    }
  }

  async sendNote(note: number, velocity: number = 127, duration: number = 500): Promise<void> {
    if (!this.isConnected) {
      throw new Error("MCP client is not connected");
    }

    try {
      await this.mcpClient.sendMidiNote(note, velocity, duration);
    } catch (error) {
      console.error(`Failed to send MIDI note ${note}:`, error);
      throw error;
    }
  }

  async sendControlChange(controller: number, value: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("MCP client is not connected");
    }

    try {
      await this.mcpClient.sendMidiCC(controller, value);
    } catch (error) {
      console.error(`Failed to send MIDI CC ${controller}:`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.mcpClient.listTools();
      return true;
    } catch (error) {
      console.error("MCP connection test failed:", error);
      this.isConnected = false;
      return false;
    }
  }

  isServerConnected(): boolean {
    return this.isConnected;
  }

  getClient(): MCPClient {
    return this.mcpClient;
  }
}
