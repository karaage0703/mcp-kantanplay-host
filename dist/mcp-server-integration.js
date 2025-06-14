"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerIntegration = void 0;
const mcp_client_1 = require("./mcp-client");
class MCPServerIntegration {
    constructor(_config) {
        this.isConnected = false;
        const scriptPath = '/Users/karaage/GitHub/mcp-kantanplay-host/start-mcp-server.sh';
        this.mcpClient = new mcp_client_1.MCPClient(scriptPath, []);
    }
    async initialize() {
        try {
            await this.mcpClient.connect();
            this.isConnected = true;
            console.log('Connected to MCP MIDI server');
            const tools = await this.mcpClient.listTools();
            console.log('Available tools:', tools);
            // MIDIポートを開く
            try {
                const openPortResult = await this.mcpClient.callTool('open_midi_port', {
                    port_index: 0
                });
                console.log('MIDI port opened:', openPortResult);
            }
            catch (error) {
                console.error('Failed to open MIDI port:', error);
            }
        }
        catch (error) {
            console.error('Failed to connect to MCP server:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.isConnected) {
            await this.mcpClient.disconnect();
            this.isConnected = false;
            console.log('Disconnected from MCP MIDI server');
        }
    }
    async sendNote(note, velocity = 127, duration = 500) {
        if (!this.isConnected) {
            throw new Error('MCP client is not connected');
        }
        try {
            await this.mcpClient.sendMidiNote(note, velocity, duration);
        }
        catch (error) {
            console.error(`Failed to send MIDI note ${note}:`, error);
            throw error;
        }
    }
    async sendControlChange(controller, value) {
        if (!this.isConnected) {
            throw new Error('MCP client is not connected');
        }
        try {
            await this.mcpClient.sendMidiCC(controller, value);
        }
        catch (error) {
            console.error(`Failed to send MIDI CC ${controller}:`, error);
            throw error;
        }
    }
    async testConnection() {
        if (!this.isConnected) {
            return false;
        }
        try {
            await this.mcpClient.listTools();
            return true;
        }
        catch (error) {
            console.error('MCP connection test failed:', error);
            this.isConnected = false;
            return false;
        }
    }
    isServerConnected() {
        return this.isConnected;
    }
    getClient() {
        return this.mcpClient;
    }
}
exports.MCPServerIntegration = MCPServerIntegration;
//# sourceMappingURL=mcp-server-integration.js.map