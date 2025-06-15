import { MusicParameters } from "./ollama-client";
import { MusicSequence } from "./music-generator";
import { getKantanPlayLabel, getKantanPlayDescription } from "./kantanplay-mapping";

export class MusicVisualizer {
  private static readonly BOX_WIDTH = 60;
  private static readonly COLORS = {
    RESET: "\x1b[0m",
    BRIGHT: "\x1b[1m",
    DIM: "\x1b[2m",
    CYAN: "\x1b[36m",
    YELLOW: "\x1b[33m",
    GREEN: "\x1b[32m",
    MAGENTA: "\x1b[35m",
    BLUE: "\x1b[34m",
  };

  static visualizeParameters(params: MusicParameters): string {
    const { BRIGHT, CYAN, YELLOW, GREEN, MAGENTA, RESET } = this.COLORS;
    const lines: string[] = [];
    
    lines.push(`${BRIGHT}♪ Music Parameters${RESET}`);
    lines.push("┌─────────────────────────────────────────────┐");
    lines.push(`│ ${CYAN}Tempo:${RESET}       ${YELLOW}${params.tempo} BPM${RESET}`.padEnd(53) + "│");
    lines.push(`│ ${CYAN}Mood:${RESET}        ${MAGENTA}${params.mood}${RESET}`.padEnd(53) + "│");
    lines.push(`│ ${CYAN}Complexity:${RESET}  ${params.complexity}/10`.padEnd(45) + "│");
    lines.push("└─────────────────────────────────────────────┘");
    
    return lines.join("\n");
  }

  static visualizeSequence(sequence: MusicSequence, params: MusicParameters): string {
    const { BRIGHT, CYAN, YELLOW, GREEN, RESET, DIM } = this.COLORS;
    const lines: string[] = [];
    
    lines.push(`\n${BRIGHT}♫ Generated Sequence${RESET}`);
    lines.push("┌" + "─".repeat(this.BOX_WIDTH - 2) + "┐");
    
    // Display note labels
    const labels = sequence.notes.map(note => getKantanPlayLabel(note));
    const labelLine = this.formatSequenceLine(labels.join(" → "));
    lines.push(`│ ${CYAN}${labelLine}${RESET} │`);
    
    // Display note descriptions
    const descriptions = sequence.notes.map(note => {
      const desc = getKantanPlayDescription(note);
      return desc.length > 8 ? desc.substring(0, 7) + "." : desc;
    });
    const descLine = this.formatSequenceLine(descriptions.join(" "));
    lines.push(`│ ${DIM}${descLine}${RESET} │`);
    
    // Display rhythm pattern
    const rhythmPattern = this.generateRhythmPattern(sequence.notes.length);
    lines.push(`│ ${YELLOW}${this.formatSequenceLine(rhythmPattern)}${RESET} │`);
    
    lines.push("└" + "─".repeat(this.BOX_WIDTH - 2) + "┘");
    
    // Add musical analysis
    lines.push(this.analyzeMusicTheory(sequence, params));
    
    return lines.join("\n");
  }

  static visualizePlayback(currentNoteIndex: number, sequence: MusicSequence): string {
    const { BRIGHT, GREEN, DIM, RESET } = this.COLORS;
    const labels = sequence.notes.map((note, index) => {
      const label = getKantanPlayLabel(note);
      if (index === currentNoteIndex) {
        return `${BRIGHT}${GREEN}[${label}]${RESET}`;
      }
      return `${DIM}${label}${RESET}`;
    });
    
    return `♪ Playing: ${labels.join(" ")}`;
  }

  private static formatSequenceLine(content: string): string {
    if (content.length > this.BOX_WIDTH - 4) {
      return content.substring(0, this.BOX_WIDTH - 7) + "...";
    }
    return content.padEnd(this.BOX_WIDTH - 4);
  }

  private static generateRhythmPattern(length: number): string {
    const patterns = ["●", "○", "◐", "◑"];
    return Array(length).fill(null).map((_, i) => patterns[i % 4]).join(" ");
  }

  private static analyzeMusicTheory(sequence: MusicSequence, params: MusicParameters): string {
    const { BRIGHT, BLUE, RESET, DIM } = this.COLORS;
    const lines: string[] = [];
    
    lines.push(`\n${BRIGHT}🎼 Musical Analysis${RESET}`);
    
    // Analyze intervals
    const intervals: string[] = [];
    for (let i = 1; i < sequence.notes.length; i++) {
      const interval = Math.abs(sequence.notes[i] - sequence.notes[i-1]);
      if (interval === 0) intervals.push("unison");
      else if (interval === 1) intervals.push("m2");
      else if (interval === 2) intervals.push("M2");
      else if (interval === 3) intervals.push("m3");
      else if (interval === 4) intervals.push("M3");
      else if (interval === 5) intervals.push("P4");
      else if (interval === 7) intervals.push("P5");
    }
    
    if (intervals.length > 0) {
      lines.push(`${BLUE}Intervals:${RESET} ${DIM}${intervals.slice(0, 8).join(", ")}${intervals.length > 8 ? "..." : ""}${RESET}`);
    }
    
    // Analyze note frequency
    const noteFrequency = new Map<number, number>();
    sequence.notes.forEach(note => {
      noteFrequency.set(note, (noteFrequency.get(note) || 0) + 1);
    });
    
    const mostFrequent = Array.from(noteFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([note, count]) => `${getKantanPlayLabel(note)} (${count}x)`)
      .join(", ");
    
    lines.push(`${BLUE}Most used:${RESET} ${DIM}${mostFrequent}${RESET}`);
    
    return lines.join("\n");
  }

  static formatTimestamp(): string {
    const now = new Date();
    return `[${now.toISOString()}]`;
  }

  static createSessionLog(params: MusicParameters, sequence: MusicSequence): object {
    return {
      timestamp: new Date().toISOString(),
      parameters: params,
      sequence: {
        notes: sequence.notes,
        labels: sequence.notes.map(note => getKantanPlayLabel(note)),
        descriptions: sequence.notes.map(note => getKantanPlayDescription(note)),
        length: sequence.notes.length,
      },
      analysis: {
        noteRange: {
          min: Math.min(...sequence.notes),
          max: Math.max(...sequence.notes),
        },
        averageVelocity: sequence.velocities.reduce((a, b) => a + b, 0) / sequence.velocities.length,
        totalDuration: sequence.durations.reduce((a, b) => a + b, 0),
      },
    };
  }
}