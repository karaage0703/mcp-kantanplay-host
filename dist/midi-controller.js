"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidiController = exports.XTOUCH_MINI_MAPPING = void 0;
const midi = __importStar(require("midi"));
exports.XTOUCH_MINI_MAPPING = [
    { controller: 1, parameter: 'tempo', min: 60, max: 180 },
    { controller: 2, parameter: 'complexity', min: 1, max: 10 },
];
class MidiController {
    constructor() {
        this.input = new midi.Input();
        this.output = new midi.Output();
        this.parameters = {
            tempo: 120,
            key: 'C',
            mood: 'happy',
            complexity: 5
        };
    }
    listInputPorts() {
        const count = this.input.getPortCount();
        const ports = [];
        for (let i = 0; i < count; i++) {
            ports.push(this.input.getPortName(i));
        }
        return ports;
    }
    listOutputPorts() {
        const count = this.output.getPortCount();
        const ports = [];
        for (let i = 0; i < count; i++) {
            ports.push(this.output.getPortName(i));
        }
        return ports;
    }
    openInputPort(portIndex) {
        this.input.openPort(portIndex);
        this.input.on('message', (_deltaTime, message) => {
            this.handleMidiMessage(message);
        });
    }
    openOutputPort(portIndex) {
        this.output.openPort(portIndex);
    }
    handleMidiMessage(message) {
        const [status, controller, value] = message;
        if ((status & 0xF0) === 0xB0) {
            const mapping = exports.XTOUCH_MINI_MAPPING.find(m => m.controller === controller);
            if (mapping) {
                const normalizedValue = value / 127;
                const scaledValue = mapping.min + (normalizedValue * (mapping.max - mapping.min));
                if (mapping.parameter === 'tempo' || mapping.parameter === 'complexity') {
                    this.parameters[mapping.parameter] = Math.round(scaledValue);
                }
                if (controller === 3) {
                    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    const keyIndex = Math.floor((value / 127) * keys.length);
                    this.parameters.key = keys[Math.min(keyIndex, keys.length - 1)];
                }
                if (controller === 4) {
                    const moods = ['happy', 'sad', 'energetic', 'calm', 'mysterious', 'dramatic'];
                    const moodIndex = Math.floor((value / 127) * moods.length);
                    this.parameters.mood = moods[Math.min(moodIndex, moods.length - 1)];
                }
                console.log('Parameter updated:', mapping.parameter, this.parameters[mapping.parameter]);
                if (this.onParameterChange) {
                    this.onParameterChange({ ...this.parameters });
                }
            }
        }
    }
    setParameterChangeCallback(callback) {
        this.onParameterChange = callback;
    }
    getParameters() {
        return { ...this.parameters };
    }
    close() {
        this.input.closePort();
        this.output.closePort();
    }
}
exports.MidiController = MidiController;
//# sourceMappingURL=midi-controller.js.map