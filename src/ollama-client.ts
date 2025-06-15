import axios from "axios";

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export interface MusicParameters {
  tempo: number;
  key: string;
  mood: string;
  complexity: number;
  sequenceLength: number;
}

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = "http://localhost:11434", model: string = "gemma3:4b") {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    try {
      console.log("Calling Ollama API with model:", this.model);
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: this.model,
          prompt,
          stream: false,
        },
        {
          timeout: 30000, // 30秒のタイムアウト
        },
      );

      console.log("Ollama response received");
      const data = response.data as OllamaResponse;
      return data.response;
    } catch (error) {
      console.error("Ollama API error:", error);
      throw error;
    }
  }

  async generateMusicSequence(params: MusicParameters): Promise<number[]> {
    const prompt = `Generate a ${params.sequenceLength || 8}-note MIDI sequence for KantanPlay.

Available notes:
- Modifiers (53-59): dim, 7th, sus4, swap, add9, M7
- Root notes (60-71): 1, 2♭, 2, 3♭, 3, 4, 5♭, 5, 6♭, 6, 7♭, 7
- Ghost note: -1 (rest/silence)

Rules:
- Tempo: ${params.tempo} BPM
- Mood: ${params.mood}
- Complexity: ${params.complexity}/10
- Use -1 for ghost notes (rests) based on complexity
- Higher complexity = more modifiers + fewer rests
- Lower complexity = mostly root notes + more rests

Complexity guide:
- 1-3: Mostly root notes (60-71), some rests (-1)
- 4-6: Mix root notes with occasional modifiers (53-59)
- 7-10: Many modifiers, fewer rests

Return exactly ${params.sequenceLength} comma-separated MIDI note numbers.
Include -1 for ghost notes/rests.
Example: 60,64,-1,67,71

Output only numbers:`;

    try {
      const response = await this.generate(prompt);
      const noteStrings = response.trim().split(",");
      let notes = noteStrings
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n) && ((n >= 53 && n <= 71) || n === -1));

      if (notes.length === 0) {
        return this.generateFallbackSequence(params.sequenceLength, params.complexity);
      }

      // Ensure exact length
      if (notes.length > params.sequenceLength) {
        notes = notes.slice(0, params.sequenceLength);
      } else if (notes.length < params.sequenceLength) {
        // Repeat pattern to reach desired length
        const originalLength = notes.length;
        for (let i = originalLength; i < params.sequenceLength; i++) {
          notes.push(notes[i % originalLength]);
        }
      }

      return notes;
    } catch (error) {
      console.error("Error generating music sequence:", error);
      return this.generateFallbackSequence(params.sequenceLength, params.complexity);
    }
  }

  private generateFallbackSequence(length: number, complexity: number = 5): number[] {
    // Enhanced fallback with ghost notes based on complexity
    const baseNotes = [60, 64, 67, 60]; // Simple pattern
    const sequence: number[] = [];

    for (let i = 0; i < length; i++) {
      // Add ghost notes based on complexity (lower complexity = more rests)
      if (complexity <= 3 && Math.random() < 0.3) {
        sequence.push(-1); // Ghost note
      } else if (complexity <= 6 && Math.random() < 0.15) {
        sequence.push(-1); // Fewer ghost notes for medium complexity
      } else {
        sequence.push(baseNotes[i % baseNotes.length]);
      }
    }

    return sequence;
  }


  async isHealthy(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`);
      return true;
    } catch {
      return false;
    }
  }
}
