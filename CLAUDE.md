# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Build and Development
```bash
npm run build          # Compile TypeScript to JavaScript
npm run dev           # Run with ts-node for development (console only)
npm run dev:web       # Run with web UI enabled on port 3000
npm run dev:debug     # Run with LLM debug output enabled
npm run dev:web:debug # Run with web UI and LLM debug output
npm start             # Run the compiled application
npm run clean         # Remove dist directory
npm run lint          # Run ESLint
npm run lint:fix      # Run ESLint and fix issues
npm run format        # Run Prettier formatter
```

### Web UI
- Access the enhanced web interface at `http://localhost:3000` when running with `npm run dev:web`
- Features real-time parameter controls, MIDI sequence visualization, and connection status
- **MIDI Device Selection**: Dynamically switch input/output devices
- **Ollama Model Selection**: Change LLM models without restart
- Bidirectional control: Web UI ↔ MIDI Controller synchronization
- Configure with `WEB_PORT` and `WEB_HOST` environment variables

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

**Web Server** (`src/web-server.ts`, `public/index.html`):
- Express.js + Socket.io server for real-time web UI
- Responsive design with parameter sliders, sequence visualization, and status displays
- Real-time bidirectional communication with MIDI controller and music generation

**Music Generation Pipeline**:
- `src/ollama-client.ts`: Interfaces with local Ollama server (default: Gemma3:4b model, switchable via Web UI)
- `src/music-generator.ts`: Orchestrates LLM calls and sequence creation with ghost note support
- `src/kantanplay-mapping.ts`: KantanPlay-specific note mapping (range 53-71, plus -1 for ghost notes)

**MIDI Controller** (`src/midi-controller.ts`):
- Real-time parameter control via MIDI CC messages
- X-Touch Mini mapping: CC1=Tempo, CC2=Complexity, CC3=Sequence Length, CC4=Mood
- Dynamic device switching via Web UI
- Triggers immediate music regeneration on parameter changes

### Key Data Structures
- Music parameters: `{ tempo: number, key: string, mood: string, complexity: number, sequenceLength: number }`
- MIDI sequences: Arrays of note numbers validated against KantanPlay mapping (including -1 for ghost notes)
- MCP tool calls: Structured protocol messages for MIDI operations
- Ghost notes: Special value -1 used for rests/silence in sequences

### External Dependencies
- MCP MIDI server must be running at `/Users/karaage/GitHub/mcp-midi-server`
- Ollama server with compatible models (switchable via Web UI)
- MIDI hardware ports (configurable via Web UI)

### Error Handling Strategy
- Multiple fallback layers: LLM failure → random sequences → hardcoded defaults
- Continuous operation: System keeps running even if individual components fail
- Graceful degradation: Missing hardware or servers don't crash the application

## Recent Improvements

### Simplified Architecture
- Removed complex chord combination logic in favor of simple MIDI sequence sending
- Streamlined LLM prompts for more reliable generation
- Enhanced error handling and recovery mechanisms

### Enhanced Web UI
- Real-time MIDI device selection and switching
- Dynamic Ollama model selection without restart
- Improved visualization with ghost note support
- Removed redundant status panels for cleaner interface

### Music Generation Enhancements
- Ghost note support (-1) for natural rhythmic patterns
- Complexity-based ghost note frequency (lower complexity = more rests)
- Simplified but more effective LLM prompting strategy
- Better fallback sequence generation

### Code Quality
- ESLint and Prettier integration for consistent code style
- TypeScript strict typing where possible
- Comprehensive error handling throughout the application