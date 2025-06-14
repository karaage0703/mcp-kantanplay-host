"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPClient = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
class MCPClient {
    constructor(serverCommand, serverArgs = [], cwd) {
        this.transport = new stdio_js_1.StdioClientTransport({
            command: serverCommand,
            args: serverArgs,
            ...(cwd && { cwd })
        });
        this.client = new index_js_1.Client({
            name: 'kantanplay-host',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {}
            }
        });
    }
    async connect() {
        await this.client.connect(this.transport);
    }
    async disconnect() {
        await this.client.close();
    }
    async listTools() {
        return await this.client.listTools();
    }
    async callTool(name, arguments_) {
        return await this.client.callTool({
            name,
            arguments: arguments_
        });
    }
    async sendMidiNote(note, velocity = 127, duration = 500) {
        return await this.callTool('send_midi_note', {
            note_number: note
        });
    }
    async sendMidiCC(controller, value) {
        return await this.callTool('send_midi_cc', {
            controller,
            value
        });
    }
}
exports.MCPClient = MCPClient;
//# sourceMappingURL=mcp-client.js.map