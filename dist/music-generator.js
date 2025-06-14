"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicGenerator = void 0;
const kantanplay_mapping_1 = require("./kantanplay-mapping");
class MusicGenerator {
    constructor(ollamaClient, mcpClient) {
        this.isPlaying = false;
        this.currentSequence = null;
        this.playbackIntervalId = null;
        this.ollamaClient = ollamaClient;
        this.mcpClient = mcpClient;
    }
    async generateSequence(params) {
        try {
            console.log('Generating music sequence with params:', params);
            const notes = await this.ollamaClient.generateMusicSequence(params);
            console.log('Generated notes:', notes);
            const validNotes = notes.filter(kantanplay_mapping_1.isValidKantanPlayNote);
            if (validNotes.length === 0) {
                validNotes.push(...this.getFallbackSequence(params));
            }
            const durations = this.generateDurations(validNotes.length, params.tempo);
            const velocities = this.generateVelocities(validNotes.length, params.complexity);
            this.currentSequence = {
                notes: validNotes,
                durations,
                velocities
            };
            return this.currentSequence;
        }
        catch (error) {
            console.error('Error generating music sequence:', error);
            return this.getFallbackMusicSequence(params);
        }
    }
    getFallbackSequence(params) {
        const scale = this.getScaleForKey(params.key);
        const sequenceLength = Math.max(4, Math.min(16, params.complexity * 2));
        const sequence = [];
        for (let i = 0; i < sequenceLength; i++) {
            const noteIndex = Math.floor(Math.random() * scale.length);
            sequence.push(scale[noteIndex]);
        }
        return sequence;
    }
    getFallbackMusicSequence(params) {
        const notes = this.getFallbackSequence(params);
        const durations = this.generateDurations(notes.length, params.tempo);
        const velocities = this.generateVelocities(notes.length, params.complexity);
        return { notes, durations, velocities };
    }
    getScaleForKey(key) {
        const baseScale = kantanplay_mapping_1.MUSICAL_SCALES.MAJOR;
        const keyOffset = this.getKeyOffset(key);
        return baseScale.map(note => {
            const transposed = note + keyOffset;
            return transposed >= 53 && transposed <= 71 ? transposed : note;
        }).filter(note => note >= 53 && note <= 71);
    }
    getKeyOffset(key) {
        const keyMap = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
            'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        return keyMap[key] || 0;
    }
    generateDurations(length, tempo) {
        const baseDuration = 60000 / tempo;
        const durations = [];
        for (let i = 0; i < length; i++) {
            const variation = Math.random() * 0.5 + 0.75;
            durations.push(Math.round(baseDuration * variation));
        }
        return durations;
    }
    generateVelocities(length, complexity) {
        const baseVelocity = 80;
        const maxVariation = complexity * 5;
        const velocities = [];
        for (let i = 0; i < length; i++) {
            const variation = (Math.random() - 0.5) * maxVariation;
            const velocity = Math.max(40, Math.min(127, baseVelocity + variation));
            velocities.push(Math.round(velocity));
        }
        return velocities;
    }
    async startPlayback(params) {
        if (this.isPlaying) {
            await this.stopPlayback();
        }
        this.isPlaying = true;
        await this.generateSequence(params);
        if (!this.currentSequence) {
            console.error('No sequence generated');
            return;
        }
        this.playSequence();
    }
    playSequence() {
        if (!this.currentSequence || !this.isPlaying)
            return;
        let noteIndex = 0;
        const playNote = async () => {
            if (!this.isPlaying || !this.currentSequence)
                return;
            const note = this.currentSequence.notes[noteIndex];
            const duration = this.currentSequence.durations[noteIndex];
            const velocity = this.currentSequence.velocities[noteIndex];
            try {
                await this.mcpClient.sendMidiNote(note, velocity, duration);
                console.log(`Playing note: ${note}, velocity: ${velocity}, duration: ${duration}ms`);
            }
            catch (error) {
                console.error('Error playing note:', error);
            }
            noteIndex = (noteIndex + 1) % this.currentSequence.notes.length;
            if (this.isPlaying) {
                this.playbackIntervalId = setTimeout(playNote, duration);
            }
        };
        playNote();
    }
    async stopPlayback() {
        this.isPlaying = false;
        if (this.playbackIntervalId) {
            clearTimeout(this.playbackIntervalId);
            this.playbackIntervalId = null;
        }
    }
    async updateParameters(params) {
        if (this.isPlaying) {
            await this.generateSequence(params);
        }
    }
    isCurrentlyPlaying() {
        return this.isPlaying;
    }
    getCurrentSequence() {
        return this.currentSequence;
    }
}
exports.MusicGenerator = MusicGenerator;
//# sourceMappingURL=music-generator.js.map