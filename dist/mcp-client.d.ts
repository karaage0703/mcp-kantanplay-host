export declare class MCPClient {
    private client;
    private transport;
    constructor(serverCommand: string, serverArgs?: string[], cwd?: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    listTools(): Promise<any>;
    callTool(name: string, arguments_: any): Promise<any>;
    sendMidiNote(note: number, velocity?: number, duration?: number): Promise<any>;
    sendMidiCC(controller: number, value: number): Promise<any>;
}
//# sourceMappingURL=mcp-client.d.ts.map