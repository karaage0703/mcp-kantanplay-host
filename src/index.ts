#!/usr/bin/env node

import { OllamaClient } from "./ollama-client";
import { MidiController } from "./midi-controller";
import { MusicGenerator } from "./music-generator";
import { MCPServerIntegration } from "./mcp-server-integration";
import { MusicVisualizer } from "./visualization";
import { MusicLogger } from "./logger";
import { WebServer, WebServerConfig } from "./web-server";
import { MusicParameters } from "./ollama-client";

interface AppConfig {
  ollamaUrl: string;
  ollamaModel: string;
  mcpServerPath: string;
  midiInputPort?: number;
  midiOutputPort?: number;
  webServerConfig?: WebServerConfig;
}

class KantanPlayHost {
  private ollamaClient: OllamaClient;
  private midiController: MidiController;
  private musicGenerator: MusicGenerator;
  private mcpIntegration: MCPServerIntegration;
  private webServer?: WebServer;
  private isRunning: boolean = false;

  constructor(config: AppConfig) {
    this.ollamaClient = new OllamaClient(config.ollamaUrl, config.ollamaModel);
    this.midiController = new MidiController();

    this.mcpIntegration = new MCPServerIntegration({
      serverPath: config.mcpServerPath,
      pythonServerPath: process.env.MCP_PYTHON_SERVER_PATH,
    });

    if (config.webServerConfig) {
      this.webServer = new WebServer(config.webServerConfig);
      this.setupWebServerIntegration();
    }

    this.musicGenerator = new MusicGenerator(
      this.ollamaClient,
      this.mcpIntegration.getClient(),
      this.webServer,
    );

    // Set MCP client and MIDI controller references for web server
    if (this.webServer) {
      this.webServer.setMcpClient(this.mcpIntegration.getClient());
      this.webServer.setMidiController(this.midiController);
    }

    this.setupMidiController(config.midiInputPort, config.midiOutputPort);
  }

  private setupMidiController(inputPort?: number, _outputPort?: number): void {
    const inputPorts = this.midiController.listInputPorts();
    const outputPorts = this.midiController.listOutputPorts();

    console.log("Available MIDI input ports:");
    inputPorts.forEach((port, index) => {
      console.log(`  ${index}: ${port}`);
    });

    console.log("Available MIDI output ports:");
    outputPorts.forEach((port, index) => {
      console.log(`  ${index}: ${port}`);
    });

    // Find X-Touch Mini for input
    let xtouchIndex = -1;
    for (let i = 0; i < inputPorts.length; i++) {
      if (
        inputPorts[i].toLowerCase().includes("x-touch") ||
        inputPorts[i].toLowerCase().includes("mini")
      ) {
        xtouchIndex = i;
        break;
      }
    }

    if (inputPort !== undefined && inputPort < inputPorts.length) {
      this.midiController.openInputPort(inputPort);
      console.log(`Opened MIDI input port: ${inputPorts[inputPort]}`);
    } else if (xtouchIndex >= 0) {
      this.midiController.openInputPort(xtouchIndex);
      console.log(`Opened X-Touch Mini input port: ${inputPorts[xtouchIndex]}`);
    } else if (inputPorts.length > 0) {
      console.log(`⚠️  X-Touch Mini not found, skipping MIDI controller setup`);
    }

    // Note: We don't open output port for MIDI controller
    // The output goes through MCP MIDI server to KantanPlay
    console.log("Note: MIDI output is handled by MCP MIDI server");

    this.midiController.setParameterChangeCallback((params) => {
      console.log("\n🎛️  MIDI Controller Update:");
      console.log(MusicVisualizer.visualizeParameters(params));
      console.log("⚡ Regenerating music sequence...");
      void this.musicGenerator.updateParameters(params);

      if (this.webServer) {
        this.webServer.broadcastParameters(params);
      }
    });
  }

  private setupWebServerIntegration(): void {
    if (!this.webServer) return;

    this.webServer.on<MusicParameters>("parameter-change", (params: MusicParameters) => {
      console.log("\n🌐 Web UI Parameter Update:");
      console.log(MusicVisualizer.visualizeParameters(params));
      console.log("⚡ Regenerating music sequence...");
      void this.musicGenerator.updateParameters(params);

      this.midiController.updateParameters(params);
    });

    this.webServer.on<{deviceName: string, deviceIndex: number}>("set-midi-input", (data) => {
      console.log(`\n🎛️ Changing MIDI input to: ${data.deviceName} (index: ${data.deviceIndex})`);
      this.midiController.openInputPort(data.deviceIndex);

      if (this.webServer) {
        this.webServer.broadcastMidiStatus({
          inputDevice: data.deviceName,
          outputDevice: null // Keep current output device
        });
      }
    });
  }

  async initialize(): Promise<void> {
    console.log("Initializing KantanPlay Host...");

    console.log("Checking Ollama connection...");
    const ollamaHealthy = await this.ollamaClient.isHealthy();
    if (!ollamaHealthy) {
      throw new Error("Ollama server is not accessible. Please ensure Docker Ollama is running.");
    }
    console.log("Ollama connection OK");

    console.log("Connecting to MCP MIDI server...");
    await this.mcpIntegration.initialize();

    if (this.webServer) {
      console.log("Starting web server...");
      await this.webServer.start();
    }

    console.log("KantanPlay Host initialized successfully!");
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("KantanPlay Host is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting KantanPlay Host...");

    const initialParams = this.midiController.getParameters();
    await this.musicGenerator.startPlayback(initialParams);

    console.log("\n🎉 KantanPlay Host is now running!");
    console.log("┌─────────────────────────────────────────────┐");
    console.log("│ 🎛️  MIDI Controller Mapping                  │");
    console.log("│                                             │");
    console.log("│ Controller 1: Tempo (60-180 BPM)           │");
    console.log("│ Controller 2: Complexity (1-10)            │");
    console.log("│ Controller 3: Sequence Length (4-16)       │");
    console.log("│ Controller 4: Mood                         │");
    console.log("│   (happy/sad/energetic/calm/               │");
    console.log("│    mysterious/dramatic)                     │");
    console.log("│                                             │");
    console.log("│ Press Ctrl+C to stop                       │");
    console.log("└─────────────────────────────────────────────┘");
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log("\n🛑 Stopping KantanPlay Host...");
    this.isRunning = false;

    this.musicGenerator.stopPlayback();
    await this.mcpIntegration.disconnect();
    this.midiController.close();

    if (this.webServer) {
      await this.webServer.stop();
    }

    // Generate and display session summary
    const logger = MusicLogger.getInstance();
    const summary = logger.generateSessionSummary();

    console.log("\n📊 Session Summary:");
    console.log("┌─────────────────────────────────────────────┐");
    console.log(`│ Session ID: ${summary.sessionId.toString().padEnd(28)} │`);
    console.log(`│ Generations: ${summary.totalGenerations.toString().padEnd(27)} │`);
    console.log(`│ Parameter Changes: ${summary.totalParameterChanges.toString().padEnd(21)} │`);
    console.log(`│ Log File: ${logger.getLogFile().split("/").pop()?.padEnd(29) || ""} │`);
    console.log("└─────────────────────────────────────────────┘");

    console.log("✅ KantanPlay Host stopped");
  }
}

async function main(): Promise<void> {
  const config: AppConfig = {
    ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    ollamaModel: process.env.OLLAMA_MODEL || "gemma3:4b",
    mcpServerPath: process.env.MCP_MIDI_SERVER_PATH || "uv",
    midiInputPort: process.env.MIDI_INPUT_PORT ? parseInt(process.env.MIDI_INPUT_PORT) : undefined,
    midiOutputPort: process.env.MIDI_OUTPUT_PORT
      ? parseInt(process.env.MIDI_OUTPUT_PORT)
      : undefined,
    webServerConfig: {
      port: parseInt(process.env.WEB_PORT || "3000"),
      host: process.env.WEB_HOST || "localhost",
    },
  };

  const app = new KantanPlayHost(config);

  const handleShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    await app.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void handleShutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void handleShutdown("SIGTERM");
  });
  
  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    void handleShutdown("UNCAUGHT_EXCEPTION");
  });
  
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    // Don't exit on unhandled rejection, just log it
  });

  try {
    await app.initialize();
    await app.start();

    process.stdin.resume();
  } catch (error) {
    console.error("Failed to start KantanPlay Host:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
