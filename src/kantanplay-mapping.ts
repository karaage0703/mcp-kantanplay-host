export interface KantanPlayNote {
  midiNote: number;
  label: string;
  description: string;
}

export const KANTANPLAY_MAPPING: KantanPlayNote[] = [
  { midiNote: 53, label: "dim", description: "diminished" },
  { midiNote: 55, label: "7", description: "dominant 7th" },
  { midiNote: 56, label: "sus4", description: "suspended 4th" },
  { midiNote: 57, label: "〜", description: "swap" },
  { midiNote: 58, label: "Add9", description: "add 9th" },
  { midiNote: 59, label: "M7", description: "major 7th" },
  { midiNote: 60, label: "1", description: "root note" },
  { midiNote: 61, label: "2♭", description: "flat 2nd" },
  { midiNote: 62, label: "2", description: "2nd" },
  { midiNote: 63, label: "3♭", description: "flat 3rd" },
  { midiNote: 64, label: "3", description: "3rd" },
  { midiNote: 65, label: "4", description: "4th" },
  { midiNote: 66, label: "5♭", description: "flat 5th" },
  { midiNote: 67, label: "5", description: "5th" },
  { midiNote: 68, label: "6♭", description: "flat 6th" },
  { midiNote: 69, label: "6", description: "6th" },
  { midiNote: 70, label: "7♭", description: "flat 7th" },
  { midiNote: 71, label: "7", description: "7th" },
];

export const MIDI_NOTE_RANGE = {
  MIN: 53,
  MAX: 71,
};

export function isValidKantanPlayNote(midiNote: number): boolean {
  return midiNote === -1 || KANTANPLAY_MAPPING.some((mapping) => mapping.midiNote === midiNote);
}

export function getKantanPlayLabel(midiNote: number): string {
  if (midiNote === -1) return "🔇"; // Ghost note symbol
  const mapping = KANTANPLAY_MAPPING.find((m) => m.midiNote === midiNote);
  return mapping ? mapping.label : "unknown";
}

export function getKantanPlayDescription(midiNote: number): string {
  if (midiNote === -1) return "ghost note/rest";
  const mapping = KANTANPLAY_MAPPING.find((m) => m.midiNote === midiNote);
  return mapping ? mapping.description : "unknown";
}

export function getAllValidNotes(): number[] {
  return KANTANPLAY_MAPPING.map((m) => m.midiNote);
}

export function getRandomKantanPlayNote(): number {
  const validNotes = getAllValidNotes();
  return validNotes[Math.floor(Math.random() * validNotes.length)];
}

export const MUSICAL_SCALES = {
  MAJOR: [60, 62, 64, 65, 67, 69, 71],
  MINOR: [60, 62, 63, 65, 67, 68, 70],
  PENTATONIC: [60, 62, 64, 67, 69],
  BLUES: [60, 63, 65, 66, 67, 70],
};
