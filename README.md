# MCP KantanPlay Host

MCPホストを使用してローカルLLM（Gemma3:4B）でかんたんプレイという楽器を演奏し続けるシステムです。

## 機能

- ローカルLLM（Ollama + Gemma3:4B）による楽曲生成
- MIDI楽器（X-Touch mini）でのリアルタイムパラメータ制御
- MCPサーバーを使用したMIDI制御
- かんたんプレイのMIDI Note対応

## 必要な環境

- Node.js 18+
- Docker（Ollama用）
- MCP MIDI Server（https://github.com/necobit/mcp-midi-server）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境設定

`.env.example`を`.env`にコピーして、MCP MIDIサーバーのパスを設定します：

```bash
cp .env.example .env
```

`.env`ファイルを編集：
```env
# MCP MIDIサーバーのディレクトリパス（必須）
MCP_PYTHON_SERVER_PATH=/path/to/your/mcp-midi-server
```

### 3. DockerでOllamaを起動

```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

### 4. Gemma3:4Bモデルをダウンロード

```bash
docker exec -it ollama ollama pull gemma3:4b
```

### 5. MCP MIDI Serverの準備

[MCP MIDI Server](https://github.com/necobit/mcp-midi-server)をクローンして準備してください。

## 使用方法

### ビルド

```bash
npm run build
```

### 実行

```bash
npm start
```

### 開発モード

```bash
npm run dev
```

## 環境変数

- `OLLAMA_URL`: OllamaサーバーのURL（デフォルト: http://localhost:11434）
- `OLLAMA_MODEL`: 使用するモデル名（デフォルト: gemma3:4b）
- `MCP_PYTHON_SERVER_PATH`: MCP MIDIサーバーのディレクトリパス（必須）
- `MCP_MIDI_SERVER_PATH`: カスタムランチャーのパス（デフォルト: uv）
- `MIDI_INPUT_PORT`: MIDI入力ポート番号
- `MIDI_OUTPUT_PORT`: MIDI出力ポート番号

## かんたんプレイ MIDI マッピング

| MIDI Note | ボタン | 説明 |
|-----------|--------|------|
| 53 | dim | diminished |
| 55 | 7 | dominant 7th |
| 56 | sus4 | suspended 4th |
| 57 | 〜 | glide/portamento |
| 58 | Add9 | add 9th |
| 59 | M7 | major 7th |
| 60 | 1 | root note |
| 61 | 2♭ | flat 2nd |
| 62 | 2 | 2nd |
| 63 | 3♭ | flat 3rd |
| 64 | 3 | 3rd |
| 65 | 4 | 4th |
| 66 | 5♭ | flat 5th |
| 67 | 5 | 5th |
| 68 | 6♭ | flat 6th |
| 69 | 6 | 6th |
| 70 | 7♭ | flat 7th |
| 71 | 7 | 7th |

## MIDI コントローラー設定（X-Touch mini）

- Controller 1: Tempo (60-180 BPM)
- Controller 2: Complexity (1-10)
- Controller 3: Key (C, C#, D, etc.)
- Controller 4: Mood (happy, sad, energetic, etc.)

## ライセンス

MIT