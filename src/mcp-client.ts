import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor(serverCommand: string, serverArgs: string[] = [], cwd?: string) {
    this.transport = new StdioClientTransport({
      command: serverCommand,
      args: serverArgs,
      ...(cwd && { cwd }),
    });
    this.client = new Client(
      {
        name: "kantanplay-host",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
  }

  async connect(): Promise<void> {
    await this.client.connect(this.transport);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  async listTools(): Promise<unknown> {
    return await this.client.listTools();
  }

  async callTool(name: string, arguments_: Record<string, unknown>): Promise<unknown> {
    return await this.client.callTool({
      name,
      arguments: arguments_,
    });
  }

  async sendMidiNote(
    note: number,
    _velocity: number = 127,
    _duration: number = 500,
  ): Promise<unknown> {
    return await this.callTool("send_midi_note", {
      note_number: note,
    });
  }

  async sendMidiCC(controller: number, value: number): Promise<unknown> {
    return await this.callTool("send_midi_cc", {
      controller,
      value,
    });
  }

  async sendMidiSequence(bpm: number, notes: number[]): Promise<unknown> {
    return await this.callTool("send_midi_sequence", {
      bpm,
      notes,
    });
  }

  async sendSimultaneousNotes(notes: number[], duration: number = 0.5): Promise<unknown> {
    return await this.callTool("send_simultaneous_notes", {
      notes,
      duration,
    });
  }

  async listMidiDevices(): Promise<unknown> {
    return await this.callTool("list_midi_ports", {});
  }

  async setMidiOutputDevice(deviceIndex: number): Promise<unknown> {
    return await this.callTool("open_midi_port", {
      port_index: deviceIndex,
    });
  }
}
