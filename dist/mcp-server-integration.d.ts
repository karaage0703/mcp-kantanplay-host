import { MCPClient } from './mcp-client';
export interface MCPServerConfig {
    serverPath: string;
    serverArgs?: string[];
}
export declare class MCPServerIntegration {
    private mcpClient;
    private isConnected;
    constructor(_config: MCPServerConfig);
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    sendNote(note: number, velocity?: number, duration?: number): Promise<void>;
    sendControlChange(controller: number, value: number): Promise<void>;
    testConnection(): Promise<boolean>;
    isServerConnected(): boolean;
    getClient(): MCPClient;
}
//# sourceMappingURL=mcp-server-integration.d.ts.map