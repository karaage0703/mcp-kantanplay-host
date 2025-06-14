export interface OllamaResponse {
    model: string;
    response: string;
    done: boolean;
}
export interface MusicParameters {
    tempo: number;
    key: string;
    mood: string;
    complexity: number;
}
export declare class OllamaClient {
    private baseUrl;
    private model;
    constructor(baseUrl?: string, model?: string);
    generate(prompt: string): Promise<string>;
    generateMusicSequence(params: MusicParameters): Promise<number[]>;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=ollama-client.d.ts.map