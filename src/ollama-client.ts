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
    const prompt = `You are a music AI that generates MIDI note sequences for KantanPlay.

IMPORTANT: KantanPlay Hardware Operation (CRITICAL FOR MUSIC GENERATION):
- Chord modifiers (53-59) are PHYSICAL BUTTONS that must be HELD DOWN while pressing root note buttons (60-71)
- This creates complex chords: MODIFIER BUTTON (held) + ROOT BUTTON (pressed) = Rich Harmony
- Example: Hold 59 (M7) + Press 60 (Root) = Major 7th chord
- Example: Hold 53 (dim) + Press 64 (3rd) = Diminished chord with 3rd

SEQUENCE GENERATION STRATEGY:
- Mix solo root notes (60-71) with modifier+root combinations
- When you output a modifier note (53-59), it should be IMMEDIATELY followed by a root note (60-71)
- This simulates the "hold modifier + press root" hardware operation

Available MIDI notes and their chord functions:
CHORD MODIFIERS (Physical buttons to hold while pressing root notes):
- 53: dim (Diminished) - creates tense, unresolved feeling
- 55: 7th (Dominant 7th) - adds jazzy, sophisticated sound
- 56: sus4 (Suspended 4th) - creates floating, unresolved tension
- 57: ~ (Swap) - KantanPlay unique: swaps major/minor chords
- 58: add9 (Add 9th) - adds bright, modern color
- 59: M7 (Major 7th) - creates dreamy, sophisticated atmosphere

ROOT NOTES (Left side buttons - can be enhanced with chord modifiers):
- 60: 1 (Root note)
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

MOOD-BASED CHORD USAGE GUIDELINES:
- happy: Use M7 (59), add9 (58), and bright intervals (64, 67, 69, 71)
- sad: Use flat intervals (61, 63, 66, 68, 70), swap to minor (57), avoid bright add9 (58)
- energetic: Use 7th (55), sus4 (56) for tension/release, strong progressions
- calm: Use M7 (59), gentle intervals (62, 64, 67), avoid dim (53) and 7th (55)
- mysterious: Use dim (53), flat 5th (66), swap (57), and unusual interval combinations
- dramatic: Use 7th (55), dim (53), strong contrasts, sudden swaps (57)

Generate a musical sequence with these parameters:
- Tempo: ${params.tempo} BPM
- Mood: ${params.mood}
- Complexity: ${params.complexity}/10

COMPOSITION STRATEGY:
- For complexity 1-3: Mostly solo root notes (60-71), rare modifier+root pairs
- For complexity 4-6: Balance solo notes with modifier+root combinations (e.g., 59,60 for M7 chord)
- For complexity 7-10: Frequent modifier+root pairs for rich harmonies

PATTERN EXAMPLES:
- Simple: 60,64,67,60 (all solo root notes)
- Moderate: 60,59,60,64,67 (M7 chord at 59,60 then solo notes)
- Complex: 60,55,64,53,67,59,60 (multiple modifier+root combinations)

Create a sequence of exactly ${params.sequenceLength} MIDI notes from the available range (53-71) that would sound good together.
REMEMBER: When using modifiers (53-59), follow them with root notes (60-71) to create chord combinations.
Use chord modifiers strategically based on the mood to enhance musical expression.
The sequence MUST contain exactly ${params.sequenceLength} notes, no more, no less.
Respond ONLY with comma-separated numbers, no explanation.

${this.generateExampleSequence(params.sequenceLength)}`;

    try {
      const response = await this.generate(prompt);
      const noteStrings = response.trim().split(",");
      let notes = noteStrings
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n) && n >= 53 && n <= 71);

      if (notes.length === 0) {
        return this.generateFallbackSequence(params.sequenceLength);
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
      return this.generateFallbackSequence(params.sequenceLength);
    }
  }

  private generateFallbackSequence(length: number): number[] {
    // Enhanced fallback with chord modifiers for more interesting sequences
    const baseNotes = [60, 64, 67, 60, 59, 62, 67, 60]; // Root, 3rd, 5th, Root, M7, 2nd, 5th, Root
    const sequence: number[] = [];

    for (let i = 0; i < length; i++) {
      sequence.push(baseNotes[i % baseNotes.length]);
    }

    return sequence;
  }

  private generateExampleSequence(length: number): string {
    // Example with proper modifier+root patterns: Root, M7+Root, 3rd, 7th+3rd, 5th, sus4+Root, add9+2nd, dim+5th
    const exampleNotes = [60, 59, 60, 64, 55, 64, 67, 56, 60, 58, 62, 53, 67, 57, 60];
    const example = [];

    for (let i = 0; i < length; i++) {
      example.push(exampleNotes[i % exampleNotes.length]);
    }

    return `Example (${length} notes): ${example.join(",")}`;
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
