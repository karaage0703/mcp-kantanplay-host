import express from "express";
import { createServer, Server as HttpServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { MusicParameters } from "./ollama-client";

export interface WebServerConfig {
  port: number;
  host: string;
}

export class WebServer {
  private app: express.Application;
  private server: HttpServer;
  private io: Server;
  private port: number;
  private host: string;
  private mcpClient?: any;
  private midiController?: any;

  constructor(config: WebServerConfig) {
    this.port = config.port;
    this.host = config.host;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "../public")));
  }

  private setupRoutes(): void {
    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    });

    this.app.get("/api/status", (req, res) => {
      res.json({ status: "running", timestamp: new Date().toISOString() });
    });
  }

  private setupSocketIO(): void {
    this.io.on("connection", (socket) => {
      console.log(`🌐 Web client connected: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`🌐 Web client disconnected: ${socket.id}`);
      });

      socket.on("parameter-change", (data: MusicParameters) => {
        console.log("🎛️  Parameter change from web UI:", data);
        this.emit("parameter-change", data);
      });

      socket.on("get-midi-devices", async () => {
        try {
          const devices: any = {};
          
          // Get MCP output devices
          if (this.mcpClient) {
            devices.output = await this.mcpClient.listMidiDevices();
          }
          
          // Get local input devices
          if (this.midiController) {
            devices.input = {
              available: this.midiController.listInputPorts(),
              current: null // Will be set by the controller
            };
          }
          
          socket.emit("midi-devices", devices);
        } catch (error) {
          console.error("Failed to get MIDI devices:", error);
          socket.emit("error", "Failed to get MIDI devices");
        }
      });

      socket.on("set-midi-output", async (data: { deviceName: string, deviceIndex: number }) => {
        if (this.mcpClient) {
          try {
            await this.mcpClient.setMidiOutputDevice(data.deviceIndex);
            this.io.emit("midi-status", { outputDevice: data.deviceName });
            console.log(`🎹 MIDI output set to: ${data.deviceName} (index: ${data.deviceIndex})`);
          } catch (error) {
            console.error("Failed to set MIDI output device:", error);
            socket.emit("error", "Failed to set MIDI output device");
          }
        }
      });

      socket.on("set-midi-input", (data: { deviceName: string, deviceIndex: number }) => {
        if (this.midiController) {
          try {
            this.emit("set-midi-input", data);
            console.log(`🎛️ MIDI input change requested: ${data.deviceName} (index: ${data.deviceIndex})`);
          } catch (error) {
            console.error("Failed to set MIDI input device:", error);
            socket.emit("error", "Failed to set MIDI input device");
          }
        }
      });
    });
  }

  public start(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.server.listen(this.port, this.host, () => {
        console.log(`🌐 Web UI available at: http://${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log("🌐 Web server stopped");
        resolve();
      });
    });
  }

  public emit(event: string, data: unknown): void {
    this.io.emit(event, data);
  }

  public on<T>(event: string, callback: (data: T) => void): void {
    this.io.on("connection", (socket) => {
      socket.on(event, callback);
    });
  }

  public broadcastParameters(params: MusicParameters): void {
    this.io.emit("parameters-update", params);
  }

  public broadcastSequence(sequence: unknown): void {
    this.io.emit("sequence-update", sequence);
  }

  public broadcastStatus(status: unknown): void {
    this.io.emit("status-update", status);
  }

  public broadcastError(error: unknown): void {
    this.io.emit("error", error);
  }

  public setMcpClient(mcpClient: any): void {
    this.mcpClient = mcpClient;
  }

  public setMidiController(midiController: any): void {
    this.midiController = midiController;
  }

  public broadcastMidiDevices(devices: unknown): void {
    this.io.emit("midi-devices", devices);
  }

  public broadcastMidiStatus(status: unknown): void {
    this.io.emit("midi-status", status);
  }
}
