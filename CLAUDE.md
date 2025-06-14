# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Build and Development
```bash
npm run build          # Compile TypeScript to JavaScript
npm run dev           # Run with ts-node for development
npm start             # Run the compiled application
npm run clean         # Remove dist directory
```

### Dependencies
- Requires Docker with Ollama running locally
- Requires the separate MCP MIDI server at `/Users/karaage/GitHub/mcp-midi-server`
- MIDI hardware controller recommended (X-Touch Mini mapping included)

## Architecture Overview

This is a real-time MIDI controller + LLM music generation system that integrates:
- **MIDI Controller Input** → **Parameter Updates** → **LLM Music Generation** → **MCP Protocol** → **KantanPlay Output**

### Core Components

**KantanPlayHost** (`src/index.ts`): Main orchestrator that coordinates all components and manages the continuous music generation loop.

**MCP Integration** (`src/mcp-client.ts`, `src/mcp-server-integration.ts`): 
- Uses Model Context Protocol to communicate with separate Python MIDI server
- Server process launched via `start-mcp-server.sh` script
- Provides MIDI note/sequence/CC message sending capabilities

**Music Generation Pipeline**:
- `src/ollama-client.ts`: Interfaces with local Ollama server (default: Gemma2:2b model)
- `src/music-generator.ts`: Orchestrates LLM calls and sequence creation
- `src/kantanplay-mapping.ts`: KantanPlay-specific note mapping (range 53-71)

**MIDI Controller** (`src/midi-controller.ts`):
- Real-time parameter control via MIDI CC messages
- X-Touch Mini mapping: CC1=Tempo, CC2=Complexity, CC3=Key, CC4=Mood
- Triggers immediate music regeneration on parameter changes

### Key Data Structures
- Music parameters: `{ tempo: number, key: string, mood: string, complexity: number }`
- MIDI sequences: Arrays of note numbers validated against KantanPlay mapping
- MCP tool calls: Structured protocol messages for MIDI operations

### External Dependencies
- MCP MIDI server must be running at `/Users/karaage/GitHub/mcp-midi-server`
- Ollama server with Gemma2:2b model (configurable via ANTHROPIC_MODEL env var)
- MIDI hardware ports (auto-detects first available input/output)

### Error Handling Strategy
- Multiple fallback layers: LLM failure → random sequences → hardcoded defaults
- Continuous operation: System keeps running even if individual components fail
- Graceful degradation: Missing hardware or servers don't crash the application