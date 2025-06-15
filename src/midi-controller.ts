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
  { controller: 3, parameter: "sequenceLength", min: 4, max: 16 }, // Sequence length
  { controller: 4, parameter: "mood", min: 0, max: 5 }, // Mood selection
];

export class MidiController {
  private input: midi.Input;
  private output: midi.Output;
  private parameters: MusicParameters;
  private onParameterChange?: (params: MusicParameters) => void;
  private currentInputPort: number = -1;
  private currentInputPortName: string = "";

  constructor() {
    this.input = new midi.Input();
    this.output = new midi.Output();
    this.parameters = {
      tempo: 120,
      key: "C",
      mood: "happy",
      complexity: 5,
      sequenceLength: 8,
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
    // Close existing port if open
    if (this.currentInputPort >= 0) {
      this.input.closePort();
      // Create new input instance to avoid listener conflicts
      this.input = new (require("midi")).Input();
    }
    
    this.input.openPort(portIndex);
    this.currentInputPort = portIndex;
    this.currentInputPortName = this.input.getPortName(portIndex);
    
    console.log(`🎛️ Opened MIDI input port: ${this.currentInputPortName} (index: ${portIndex})`);
    
    this.input.on("message", (_deltaTime: number, message: number[]) => {
      console.log(`🎵 MIDI message received: [${message.join(', ')}]`);
      this.handleMidiMessage(message);
    });
  }

  openOutputPort(portIndex: number): void {
    this.output.openPort(portIndex);
  }

  private handleMidiMessage(message: number[]): void {
    const [status, controller, value] = message;
    
    console.log(`🎛️ Processing MIDI: Status=${status.toString(16)}, Controller=${controller}, Value=${value}`);

    if ((status & 0xf0) === 0xb0) {
      console.log(`✅ Control Change message detected (CC${controller} = ${value})`);
      
      const mapping = XTOUCH_MINI_MAPPING.find((m) => m.controller === controller);
      if (mapping) {
        console.log(`🎯 Found mapping for CC${controller} -> ${mapping.parameter}`);
        
        const normalizedValue = value / 127;
        const scaledValue = mapping.min + normalizedValue * (mapping.max - mapping.min);

        if (
          mapping.parameter === "tempo" ||
          mapping.parameter === "complexity" ||
          mapping.parameter === "sequenceLength"
        ) {
          this.parameters[mapping.parameter] = Math.round(scaledValue);
        }

        // Controller 4: Mood selection
        if (controller === 4 && mapping.parameter === "mood") {
          const moods = ["happy", "sad", "energetic", "calm", "mysterious", "dramatic"];
          const moodIndex = Math.floor((value / 127) * moods.length);
          this.parameters.mood = moods[Math.min(moodIndex, moods.length - 1)];
        }

        console.log(`📡 Parameter updated: ${mapping.parameter} = ${this.parameters[mapping.parameter]}`);

        if (this.onParameterChange) {
          this.onParameterChange({ ...this.parameters });
        }
      } else {
        console.log(`⚠️ No mapping found for CC${controller}`);
      }
    } else {
      console.log(`ℹ️ Non-CC message (status: ${status.toString(16)})`);
    }
  }

  setParameterChangeCallback(callback: (params: MusicParameters) => void): void {
    this.onParameterChange = callback;
  }

  getParameters(): MusicParameters {
    return { ...this.parameters };
  }

  updateParameters(params: MusicParameters): void {
    this.parameters = { ...params };
    console.log("📡 Parameters updated externally:", this.parameters);
  }

  getCurrentInputPort(): { index: number; name: string } {
    return {
      index: this.currentInputPort,
      name: this.currentInputPortName
    };
  }

  close(): void {
    if (this.currentInputPort >= 0) {
      this.input.closePort();
    }
    // Output port is not used, so we don't need to close it
  }
}
