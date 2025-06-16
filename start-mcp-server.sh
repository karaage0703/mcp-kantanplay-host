#!/bin/bash
SERVER_DIR=${MCP_PYTHON_SERVER_PATH:-/home/karaage/mcp-midi-server}
SERVER_SCRIPT=${MCP_SERVER_SCRIPT:-kantanplay-midi-server-jetson.py}
cd "$SERVER_DIR"
exec uv run python "$SERVER_SCRIPT"