export interface KantanPlayNote {
    midiNote: number;
    label: string;
    description: string;
}
export declare const KANTANPLAY_MAPPING: KantanPlayNote[];
export declare const MIDI_NOTE_RANGE: {
    MIN: number;
    MAX: number;
};
export declare function isValidKantanPlayNote(midiNote: number): boolean;
export declare function getKantanPlayLabel(midiNote: number): string;
export declare function getKantanPlayDescription(midiNote: number): string;
export declare function getAllValidNotes(): number[];
export declare function getRandomKantanPlayNote(): number;
export declare const MUSICAL_SCALES: {
    MAJOR: number[];
    MINOR: number[];
    PENTATONIC: number[];
    BLUES: number[];
};
//# sourceMappingURL=kantanplay-mapping.d.ts.map