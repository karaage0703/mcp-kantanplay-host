import { OllamaClient, MusicParameters } from "./ollama-client";
import { MCPClient } from "./mcp-client";
import { isValidKantanPlayNote, MUSICAL_SCALES } from "./kantanplay-mapping";
import { MusicVisualizer } from "./visualization";
import { MusicLogger } from "./logger";

export interface MusicSequence {
  notes: number[];
  durations: number[];
  velocities: number[];
}

export class MusicGenerator {
  private ollamaClient: OllamaClient;
  private mcpClient: MCPClient;
  private isPlaying: boolean = false;
  private currentSequence: MusicSequence | null = null;
  private playbackIntervalId: NodeJS.Timeout | null = null;
  private logger: MusicLogger;
  private currentParams: MusicParameters | null = null;

  constructor(ollamaClient: OllamaClient, mcpClient: MCPClient) {
    this.ollamaClient = ollamaClient;
    this.mcpClient = mcpClient;
    this.logger = MusicLogger.getInstance();
  }

  async generateSequence(params: MusicParameters): Promise<MusicSequence> {
    try {
      console.log(MusicVisualizer.visualizeParameters(params));
      console.log("🎵 Generating music sequence...");
      
      const notes = await this.ollamaClient.generateMusicSequence(params);
      const validNotes = notes.filter(isValidKantanPlayNote);

      if (validNotes.length === 0) {
        validNotes.push(...this.getFallbackSequence(params));
        console.log("⚠️  No valid notes generated, using fallback sequence");
      }

      const durations = this.generateDurations(validNotes.length, params.tempo);
      const velocities = this.generateVelocities(validNotes.length, params.complexity);

      this.currentSequence = {
        notes: validNotes,
        durations,
        velocities,
      };

      // Display the generated sequence with visualization
      console.log(MusicVisualizer.visualizeSequence(this.currentSequence, params));
      
      // Log structured data for analysis
      const sessionLog = MusicVisualizer.createSessionLog(params, this.currentSequence);
      console.log(`📊 Session: ${this.logger.getSessionId()}`);
      
      // Log to structured log file
      this.logger.logGeneration(params, this.currentSequence, (sessionLog as any).analysis);

      return this.currentSequence;
    } catch (error) {
      console.error("❌ Error generating music sequence:", error);
      return this.getFallbackMusicSequence(params);
    }
  }

  private getFallbackSequence(params: MusicParameters): number[] {
    const scale = this.getScaleForKey(params.key);
    const sequenceLength = Math.max(4, Math.min(16, params.complexity * 2));
    const sequence: number[] = [];

    for (let i = 0; i < sequenceLength; i++) {
      const noteIndex = Math.floor(Math.random() * scale.length);
      sequence.push(scale[noteIndex]);
    }

    return sequence;
  }

  private getFallbackMusicSequence(params: MusicParameters): MusicSequence {
    const notes = this.getFallbackSequence(params);
    const durations = this.generateDurations(notes.length, params.tempo);
    const velocities = this.generateVelocities(notes.length, params.complexity);

    return { notes, durations, velocities };
  }

  private getScaleForKey(key: string): number[] {
    const baseScale = MUSICAL_SCALES.MAJOR;
    const keyOffset = this.getKeyOffset(key);
    return baseScale
      .map((note) => {
        const transposed = note + keyOffset;
        return transposed >= 53 && transposed <= 71 ? transposed : note;
      })
      .filter((note) => note >= 53 && note <= 71);
  }

  private getKeyOffset(key: string): number {
    const keyMap: { [key: string]: number } = {
      C: 0,
      "C#": 1,
      D: 2,
      "D#": 3,
      E: 4,
      F: 5,
      "F#": 6,
      G: 7,
      "G#": 8,
      A: 9,
      "A#": 10,
      B: 11,
    };
    return keyMap[key] || 0;
  }

  private generateDurations(length: number, tempo: number): number[] {
    const baseDuration = 60000 / tempo;
    const durations: number[] = [];

    for (let i = 0; i < length; i++) {
      const variation = Math.random() * 0.5 + 0.75;
      durations.push(Math.round(baseDuration * variation));
    }

    return durations;
  }

  private generateVelocities(length: number, complexity: number): number[] {
    const baseVelocity = 80;
    const maxVariation = complexity * 5;
    const velocities: number[] = [];

    for (let i = 0; i < length; i++) {
      const variation = (Math.random() - 0.5) * maxVariation;
      const velocity = Math.max(40, Math.min(127, baseVelocity + variation));
      velocities.push(Math.round(velocity));
    }

    return velocities;
  }

  async startPlayback(params: MusicParameters): Promise<void> {
    if (this.isPlaying) {
      this.stopPlayback();
    }

    this.isPlaying = true;
    this.currentParams = params;
    this.logger.logPlaybackStart(params);
    
    await this.generateSequence(params);

    if (!this.currentSequence) {
      console.error("No sequence generated");
      return;
    }

    void this.playSequence();
  }

  private async playSequence(): Promise<void> {
    if (!this.currentSequence || !this.isPlaying || !this.currentParams) return;

    const tempo = this.currentParams.tempo;

    try {
      console.log(`\n🎶 Playing sequence with ${this.currentSequence.notes.length} notes at ${tempo} BPM`);
      await this.mcpClient.sendMidiSequence(tempo, this.currentSequence.notes);
      console.log("✅ Sequence playback completed");

      // Schedule next playback if still playing
      if (this.isPlaying) {
        const totalDuration = this.currentSequence.notes.length * (60000 / tempo) * 2; // Approximate duration
        this.playbackIntervalId = setTimeout(() => {
          void this.playSequence();
        }, totalDuration);
      }
    } catch (error) {
      console.error("❌ Error playing sequence:", error);
    }
  }

  stopPlayback(): void {
    this.isPlaying = false;
    this.logger.logPlaybackStop();
    if (this.playbackIntervalId) {
      clearTimeout(this.playbackIntervalId);
      this.playbackIntervalId = null;
    }
  }

  async updateParameters(params: MusicParameters): Promise<void> {
    if (this.currentParams) {
      this.logger.logParameterChange(this.currentParams, params);
    }
    this.currentParams = params;
    
    if (this.isPlaying) {
      await this.generateSequence(params);
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentSequence(): MusicSequence | null {
    return this.currentSequence;
  }
}
