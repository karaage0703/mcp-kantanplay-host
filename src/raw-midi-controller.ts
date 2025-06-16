import * as fs from "fs";
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
  { controller: 3, parameter: "sequenceLength", min: 4, max: 16 },
  { controller: 4, parameter: "mood", min: 0, max: 5 },
];

export class RawMidiController {
  private parameters: MusicParameters;
  private onParameterChange?: (params: MusicParameters) => void;
  private devicePath: string = "";
  private deviceStream?: fs.ReadStream;
  private buffer: Buffer = Buffer.alloc(0);

  constructor() {
    this.parameters = {
      tempo: 120,
      key: "C",
      mood: "happy",
      complexity: 5,
      sequenceLength: 8,
    };
  }

  listRawMidiDevices(): string[] {
    const devices: string[] = [];
    
    // Only check for the two specified devices
    const possibleDevices = [
      "/dev/midi-xtouch",
      "/dev/midi-um1"
    ];

    for (const device of possibleDevices) {
      try {
        if (fs.existsSync(device)) {
          // Check if it's readable
          fs.accessSync(device, fs.constants.R_OK);
          devices.push(device);
        }
      } catch {
        // Device exists but not readable, skip it
      }
    }

    return devices;
  }

  openDevice(devicePath: string): void {
    // Close existing device if open
    if (this.deviceStream) {
      this.deviceStream.destroy();
      this.deviceStream = undefined;
    }

    this.devicePath = devicePath;
    
    try {
      this.deviceStream = fs.createReadStream(devicePath);
      console.log(`🎛️ Opened Raw MIDI device: ${devicePath}`);

      this.deviceStream.on("data", (chunk: string | Buffer) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        this.buffer = Buffer.concat([this.buffer, buffer]);
        this.processRawMidiData();
      });

      this.deviceStream.on("error", (err) => {
        console.error(`❌ Error reading from MIDI device ${devicePath}:`, err);
      });

      this.deviceStream.on("close", () => {
        console.log(`🔌 MIDI device ${devicePath} closed`);
      });
    } catch (err) {
      console.error(`❌ Failed to open MIDI device ${devicePath}:`, err);
      throw err;
    }
  }

  private processRawMidiData(): void {
    while (this.buffer.length >= 3) {
      // Check for valid MIDI status byte
      const status = this.buffer[0];
      
      // MIDI status bytes have the MSB set (0x80-0xFF)
      if ((status & 0x80) === 0) {
        // Not a status byte, skip this byte and continue
        this.buffer = this.buffer.slice(1);
        continue;
      }

      // Check if it's a Control Change message (0xB0-0xBF)
      if ((status & 0xF0) === 0xB0) {
        if (this.buffer.length >= 3) {
          const controller = this.buffer[1];
          const value = this.buffer[2];
          
          // Process the CC message
          this.handleControlChange(controller, value);
          
          // Remove processed bytes
          this.buffer = this.buffer.slice(3);
        } else {
          // Not enough data yet, wait for more
          break;
        }
      } else {
        // Other MIDI message types
        // Determine message length based on status
        let messageLength = 3; // Default for most messages
        
        const messageType = status & 0xF0;
        if (messageType === 0xC0 || messageType === 0xD0) {
          // Program Change and Channel Pressure are 2 bytes
          messageLength = 2;
        } else if (messageType === 0xF0) {
          // System messages vary, skip for now
          this.buffer = this.buffer.slice(1);
          continue;
        }
        
        if (this.buffer.length >= messageLength) {
          // Skip non-CC messages
          this.buffer = this.buffer.slice(messageLength);
        } else {
          break;
        }
      }
    }
  }

  private handleControlChange(controller: number, value: number): void {
    console.log(`🎵 Raw MIDI CC received: CC${controller} = ${value}`);

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

      console.log(
        `📡 Parameter updated: ${mapping.parameter} = ${this.parameters[mapping.parameter]}`,
      );

      if (this.onParameterChange) {
        this.onParameterChange({ ...this.parameters });
      }
    } else {
      console.log(`⚠️ No mapping found for CC${controller}`);
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

  getCurrentDevice(): string {
    return this.devicePath;
  }

  close(): void {
    if (this.deviceStream) {
      this.deviceStream.destroy();
      this.deviceStream = undefined;
    }
  }
}