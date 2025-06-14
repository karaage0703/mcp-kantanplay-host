import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor(serverCommand: string, serverArgs: string[] = [], cwd?: string) {
    this.transport = new StdioClientTransport({
      command: serverCommand,
      args: serverArgs,
      ...(cwd && { cwd })
    });
    this.client = new Client(
      {
        name: 'kantanplay-host',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
  }

  async connect(): Promise<void> {
    await this.client.connect(this.transport);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  async listTools(): Promise<any> {
    return await this.client.listTools();
  }

  async callTool(name: string, arguments_: any): Promise<any> {
    return await this.client.callTool({
      name,
      arguments: arguments_
    });
  }

  async sendMidiNote(note: number, velocity: number = 127, duration: number = 500): Promise<any> {
    return await this.callTool('send_midi_note', {
      note_number: note
    });
  }

  async sendMidiCC(controller: number, value: number): Promise<any> {
    return await this.callTool('send_midi_cc', {
      controller,
      value
    });
  }
}