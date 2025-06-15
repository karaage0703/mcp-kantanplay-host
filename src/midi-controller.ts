import * as midi from "midi";
import { MusicParameters } from "./ollama-client";

export interface MidiControllerMapping {
  controller: number;
  parameter: keyof MusicParameters;
  min: number;
  max: number;
}

export const XTOUCH_MINI_MAPPING: MidiControllerMapping[] = [
  { controller: 1, parameter: "tempo", min: 60, max: 180 },
  { controller: 2, parameter: "complexity", min: 1, max: 10 },
  { controller: 3, parameter: "mood", min: 0, max: 5 }, // Mood selection
];

export class MidiController {
  private input: midi.Input;
  private output: midi.Output;
  private parameters: MusicParameters;
  private onParameterChange?: (params: MusicParameters) => void;

  constructor() {
    this.input = new midi.Input();
    this.output = new midi.Output();
    this.parameters = {
      tempo: 120,
      key: "C",
      mood: "happy",
      complexity: 5,
    };
  }

  listInputPorts(): string[] {
    const count = this.input.getPortCount();
    const ports: string[] = [];
    for (let i = 0; i < count; i++) {
      ports.push(this.input.getPortName(i));
    }
    return ports;
  }

  listOutputPorts(): string[] {
    const count = this.output.getPortCount();
    const ports: string[] = [];
    for (let i = 0; i < count; i++) {
      ports.push(this.output.getPortName(i));
    }
    return ports;
  }

  openInputPort(portIndex: number): void {
    this.input.openPort(portIndex);
    this.input.on("message", (_deltaTime: number, message: number[]) => {
      this.handleMidiMessage(message);
    });
  }

  openOutputPort(portIndex: number): void {
    this.output.openPort(portIndex);
  }

  private handleMidiMessage(message: number[]): void {
    const [status, controller, value] = message;

    if ((status & 0xf0) === 0xb0) {
      const mapping = XTOUCH_MINI_MAPPING.find((m) => m.controller === controller);
      if (mapping) {
        const normalizedValue = value / 127;
        const scaledValue = mapping.min + normalizedValue * (mapping.max - mapping.min);

        if (mapping.parameter === "tempo" || mapping.parameter === "complexity") {
          this.parameters[mapping.parameter] = Math.round(scaledValue);
        }

        // Controller 3: Mood selection
        if (controller === 3 && mapping.parameter === "mood") {
          const moods = ["happy", "sad", "energetic", "calm", "mysterious", "dramatic"];
          const moodIndex = Math.floor((value / 127) * moods.length);
          this.parameters.mood = moods[Math.min(moodIndex, moods.length - 1)];
        }

        console.log("Parameter updated:", mapping.parameter, this.parameters[mapping.parameter]);

        if (this.onParameterChange) {
          this.onParameterChange({ ...this.parameters });
        }
      }
    }
  }

  setParameterChangeCallback(callback: (params: MusicParameters) => void): void {
    this.onParameterChange = callback;
  }

  getParameters(): MusicParameters {
    return { ...this.parameters };
  }

  close(): void {
    this.input.closePort();
    // Output port is not used, so we don't need to close it
  }
}
