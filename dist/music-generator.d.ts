import { OllamaClient, MusicParameters } from './ollama-client';
import { MCPClient } from './mcp-client';
export interface MusicSequence {
    notes: number[];
    durations: number[];
    velocities: number[];
}
export declare class MusicGenerator {
    private ollamaClient;
    private mcpClient;
    private isPlaying;
    private currentSequence;
    private playbackIntervalId;
    constructor(ollamaClient: OllamaClient, mcpClient: MCPClient);
    generateSequence(params: MusicParameters): Promise<MusicSequence>;
    private getFallbackSequence;
    private getFallbackMusicSequence;
    private getScaleForKey;
    private getKeyOffset;
    private generateDurations;
    private generateVelocities;
    startPlayback(params: MusicParameters): Promise<void>;
    private playSequence;
    stopPlayback(): Promise<void>;
    updateParameters(params: MusicParameters): Promise<void>;
    isCurrentlyPlaying(): boolean;
    getCurrentSequence(): MusicSequence | null;
}
//# sourceMappingURL=music-generator.d.ts.map