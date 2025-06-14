import { MusicParameters } from './ollama-client';
export interface MidiControllerMapping {
    controller: number;
    parameter: keyof MusicParameters;
    min: number;
    max: number;
}
export declare const XTOUCH_MINI_MAPPING: MidiControllerMapping[];
export declare class MidiController {
    private input;
    private output;
    private parameters;
    private onParameterChange?;
    constructor();
    listInputPorts(): string[];
    listOutputPorts(): string[];
    openInputPort(portIndex: number): void;
    openOutputPort(portIndex: number): void;
    private handleMidiMessage;
    setParameterChangeCallback(callback: (params: MusicParameters) => void): void;
    getParameters(): MusicParameters;
    close(): void;
}
//# sourceMappingURL=midi-controller.d.ts.map