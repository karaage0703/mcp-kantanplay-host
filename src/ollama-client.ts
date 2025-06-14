import axios from 'axios';

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
}

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'gemma3:4b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    try {
      console.log('Calling Ollama API with model:', this.model);
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false
      }, {
        timeout: 30000 // 30秒のタイムアウト
      });
      
      console.log('Ollama response received');
      return response.data.response;
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  }

  async generateMusicSequence(params: MusicParameters): Promise<number[]> {
    const prompt = `You are a music AI that generates MIDI note sequences for KantanPlay.
Available MIDI notes and their meanings:
- 53: dim (diminished)
- 55: 7 (dominant 7th)
- 56: sus4 (suspended 4th)
- 57: ~ (glide/portamento)
- 58: Add9 (add 9th)
- 59: M7 (major 7th)
- 60: 1 (root note)
- 61: 2♭ (flat 2nd)
- 62: 2 (2nd)
- 63: 3♭ (flat 3rd)
- 64: 3 (3rd)
- 65: 4 (4th)
- 66: 5♭ (flat 5th)
- 67: 5 (5th)
- 68: 6♭ (flat 6th)
- 69: 6 (6th)
- 70: 7♭ (flat 7th)
- 71: 7 (7th)

Generate a musical sequence with these parameters:
- Tempo: ${params.tempo} BPM
- Key: ${params.key}
- Mood: ${params.mood}
- Complexity: ${params.complexity}/10

Create a sequence of 8-16 MIDI notes from the available range (53-71) that would sound good together.
Respond ONLY with comma-separated numbers, no explanation.
Example: 60,64,67,60,62,69,67,60`;

    try {
      const response = await this.generate(prompt);
      const noteStrings = response.trim().split(',');
      const notes = noteStrings
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n >= 53 && n <= 71);
      
      if (notes.length === 0) {
        return [60, 64, 67, 60];
      }
      
      return notes;
    } catch (error) {
      console.error('Error generating music sequence:', error);
      return [60, 64, 67, 60];
    }
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