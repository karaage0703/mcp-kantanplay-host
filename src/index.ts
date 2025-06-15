#!/usr/bin/env node

import { OllamaClient } from "./ollama-client";
import { MidiController } from "./midi-controller";
import { MusicGenerator } from "./music-generator";
import { MCPServerIntegration } from "./mcp-server-integration";

interface AppConfig {
  ollamaUrl: string;
  ollamaModel: string;
  mcpServerPath: string;
  midiInputPort?: number;
  midiOutputPort?: number;
}

class KantanPlayHost {
  private ollamaClient: OllamaClient;
  private midiController: MidiController;
  private musicGenerator: MusicGenerator;
  private mcpIntegration: MCPServerIntegration;
  private isRunning: boolean = false;

  constructor(config: AppConfig) {
    this.ollamaClient = new OllamaClient(config.ollamaUrl, config.ollamaModel);
    this.midiController = new MidiController();

    this.mcpIntegration = new MCPServerIntegration({
      serverPath: config.mcpServerPath,
      pythonServerPath: process.env.MCP_PYTHON_SERVER_PATH,
    });

    this.musicGenerator = new MusicGenerator(this.ollamaClient, this.mcpIntegration.getClient());

    this.setupMidiController(config.midiInputPort, config.midiOutputPort);
  }

  private setupMidiController(inputPort?: number, outputPort?: number): void {
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

    if (inputPort !== undefined && inputPort < inputPorts.length) {
      this.midiController.openInputPort(inputPort);
      console.log(`Opened MIDI input port: ${inputPorts[inputPort]}`);
    } else if (inputPorts.length > 0) {
      this.midiController.openInputPort(0);
      console.log(`Opened default MIDI input port: ${inputPorts[0]}`);
    }

    if (outputPort !== undefined && outputPort < outputPorts.length) {
      this.midiController.openOutputPort(outputPort);
      console.log(`Opened MIDI output port: ${outputPorts[outputPort]}`);
    } else if (outputPorts.length > 0) {
      this.midiController.openOutputPort(0);
      console.log(`Opened default MIDI output port: ${outputPorts[0]}`);
    }

    this.midiController.setParameterChangeCallback((params) => {
      console.log("Music parameters updated:", params);
      void this.musicGenerator.updateParameters(params);
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

    console.log("KantanPlay Host is now running!");
    console.log("Use your MIDI controller to adjust parameters:");
    console.log("  - Controller 1: Tempo (60-180 BPM)");
    console.log("  - Controller 2: Complexity (1-10)");
    console.log("  - Controller 3: Key (C, C#, D, etc.)");
    console.log("  - Controller 4: Mood (happy, sad, energetic, etc.)");
    console.log("Press Ctrl+C to stop");
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log("Stopping KantanPlay Host...");
    this.isRunning = false;

    this.musicGenerator.stopPlayback();
    await this.mcpIntegration.disconnect();
    this.midiController.close();

    console.log("KantanPlay Host stopped");
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
