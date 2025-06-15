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

export class OllamaClientSimple {
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
          options: {
            temperature: 0.9,
            top_p: 0.9,
            repeat_penalty: 1.2
          }
        },
        {
          timeout: 30000,
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
    // SIMPLIFIED prompt for faster processing
    const prompt = `Generate ${params.sequenceLength} MIDI notes for KantanPlay music.
Range: 53-71 (modifiers 53-59, roots 60-71)
Mood: ${params.mood}
Complexity: ${params.complexity}/10

For ${params.mood} mood: use appropriate note combinations.
Output exactly ${params.sequenceLength} comma-separated numbers only.
Example: 60,59,60,64,67,60,64,67`;

    try {
      const response = await this.generate(prompt);
      const noteStrings = response.trim().split(",");
      let notes = noteStrings
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n) && n >= 53 && n <= 71);

      if (notes.length === 0) {
        return this.generateFallbackSequence(params.sequenceLength);
      }

      // Simple debug output
      console.log(`🎵 Simple sequence: [${notes.join(', ')}]`);

      // Adjust length
      if (notes.length > params.sequenceLength) {
        notes = notes.slice(0, params.sequenceLength);
      } else if (notes.length < params.sequenceLength) {
        const originalLength = notes.length;
        for (let i = originalLength; i < params.sequenceLength; i++) {
          notes.push(notes[i % originalLength]);
        }
      }

      return notes;
    } catch (error) {
      console.error("Error generating music sequence:", error);
      return this.generateFallbackSequence(params.sequenceLength);
    }
  }

  private generateFallbackSequence(length: number): number[] {
    const baseNotes = [60, 64, 67, 60, 59, 62, 67, 60];
    const sequence: number[] = [];

    for (let i = 0; i < length; i++) {
      sequence.push(baseNotes[i % baseNotes.length]);
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