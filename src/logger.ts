import * as fs from "fs";
import * as path from "path";
import { MusicParameters } from "./ollama-client";
import { MusicSequence } from "./music-generator";

export interface SessionData {
  timestamp: string;
  sessionId: string;
  type: "generation" | "parameter_change" | "playback_start" | "playback_stop" | "error";
  parameters?: MusicParameters;
  sequence?: {
    notes: number[];
    labels: string[];
    length: number;
    analysis: object;
  };
  error?: string;
  metadata?: object;
}

export class MusicLogger {
  private static instance: MusicLogger;
  private sessionId: string;
  private logDir: string;
  private logFile: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.logDir = path.join(process.cwd(), "logs");
    this.logFile = path.join(this.logDir, `music-session-${this.sessionId}.json`);
    this.ensureLogDirectory();
  }

  static getInstance(): MusicLogger {
    if (!MusicLogger.instance) {
      MusicLogger.instance = new MusicLogger();
    }
    return MusicLogger.instance;
  }

  private generateSessionId(): string {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now
      .getDate()
      .toString()
      .padStart(2, "0")}-${now.getHours().toString().padStart(2, "0")}${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  logGeneration(parameters: MusicParameters, sequence: MusicSequence, analysis: object): void {
    const data: SessionData = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: "generation",
      parameters,
      sequence: {
        notes: sequence.notes,
        labels: [], // Will be filled by caller
        length: sequence.notes.length,
        analysis,
      },
    };

    this.writeLog(data);
  }

  logParameterChange(oldParams: MusicParameters, newParams: MusicParameters): void {
    const data: SessionData = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: "parameter_change",
      parameters: newParams,
      metadata: {
        previousParameters: oldParams,
        changes: this.getParameterChanges(oldParams, newParams),
      },
    };

    this.writeLog(data);
  }

  logPlaybackStart(parameters: MusicParameters): void {
    const data: SessionData = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: "playback_start",
      parameters,
    };

    this.writeLog(data);
  }

  logPlaybackStop(): void {
    const data: SessionData = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: "playback_stop",
    };

    this.writeLog(data);
  }

  logError(error: string, context?: object): void {
    const data: SessionData = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type: "error",
      error,
      metadata: context,
    };

    this.writeLog(data);
  }

  private getParameterChanges(
    oldParams: MusicParameters,
    newParams: MusicParameters,
  ): Partial<MusicParameters> {
    const changes: Partial<MusicParameters> = {};

    if (oldParams.tempo !== newParams.tempo) changes.tempo = newParams.tempo;
    if (oldParams.key !== newParams.key) changes.key = newParams.key;
    if (oldParams.mood !== newParams.mood) changes.mood = newParams.mood;
    if (oldParams.complexity !== newParams.complexity) changes.complexity = newParams.complexity;

    return changes;
  }

  private writeLog(data: SessionData): void {
    try {
      const logEntry = JSON.stringify(data) + "\n";
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getLogFile(): string {
    return this.logFile;
  }

  // Read session logs for analysis
  readSessionLogs(): SessionData[] {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      return lines.map((line) => JSON.parse(line));
    } catch (error) {
      console.error("Failed to read session logs:", error);
      return [];
    }
  }

  // Generate session summary
  generateSessionSummary(): {
    sessionId: string;
    startTime?: string;
    endTime?: string;
    totalGenerations: number;
    totalParameterChanges: number;
    averageSequenceLength: number;
    mostUsedParameters: object;
  } {
    const logs = this.readSessionLogs();
    const generations = logs.filter((log) => log.type === "generation");
    const parameterChanges = logs.filter((log) => log.type === "parameter_change");

    return {
      sessionId: this.sessionId,
      startTime: logs[0]?.timestamp,
      endTime: logs[logs.length - 1]?.timestamp,
      totalGenerations: generations.length,
      totalParameterChanges: parameterChanges.length,
      averageSequenceLength:
        generations.reduce((sum, gen) => sum + (gen.sequence?.length || 0), 0) /
          generations.length || 0,
      mostUsedParameters: this.analyzeMostUsedParameters(generations),
    };
  }

  private analyzeMostUsedParameters(generations: SessionData[]): object {
    const tempos: number[] = [];
    const keys: string[] = [];
    const moods: string[] = [];
    const complexities: number[] = [];

    generations.forEach((gen) => {
      if (gen.parameters) {
        tempos.push(gen.parameters.tempo);
        keys.push(gen.parameters.key);
        moods.push(gen.parameters.mood);
        complexities.push(gen.parameters.complexity);
      }
    });

    return {
      averageTempo: tempos.reduce((a, b) => a + b, 0) / tempos.length || 0,
      mostUsedKey: this.getMostFrequent(keys),
      mostUsedMood: this.getMostFrequent(moods),
      averageComplexity: complexities.reduce((a, b) => a + b, 0) / complexities.length || 0,
    };
  }

  private getMostFrequent(arr: string[]): string {
    const frequency = arr.reduce(
      (acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.keys(frequency).reduce((a, b) => (frequency[a] > frequency[b] ? a : b), "");
  }
}
