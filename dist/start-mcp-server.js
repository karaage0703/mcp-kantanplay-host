"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMCPServer = startMCPServer;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
function startMCPServer() {
    return new Promise((resolve, reject) => {
        const serverDir = '/Users/karaage/GitHub/mcp-midi-server';
        const serverPath = path.join(serverDir, 'kantanplay-midi-server.py');
        const uvProcess = (0, child_process_1.spawn)('uv', ['run', 'python', serverPath], {
            cwd: serverDir,
            stdio: 'inherit'
        });
        uvProcess.on('error', (error) => {
            console.error('Failed to start MCP server:', error);
            reject(error);
        });
        uvProcess.on('spawn', () => {
            console.log('MCP MIDI server started successfully');
            setTimeout(() => resolve(), 2000); // Wait 2 seconds for server to initialize
        });
        uvProcess.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`MCP server exited with code ${code}`));
            }
        });
    });
}
//# sourceMappingURL=start-mcp-server.js.map