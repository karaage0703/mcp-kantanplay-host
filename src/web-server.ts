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
}
