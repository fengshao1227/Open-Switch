# Open Switch

<p align="center">
  <img src="app-icon-placeholder.png" alt="Open Switch Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Configuration Manager for OpenCode CLI</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## Features

### AI Provider Management
- Add, edit, and delete AI provider configurations
- Support for multiple SDK types (OpenAI, Anthropic, Google, OpenAI-compatible)
- Secure API key management via `~/.local/share/opencode/auth.json`
- Custom headers support for each provider
- Model configuration with thinking mode and cache key options

### MCP Server Management
- Configure Model Context Protocol (MCP) servers
- Support for both local (command-based) and remote (URL-based) servers
- Environment variables configuration
- Enable/disable individual servers
- **Windows compatibility**: Automatic `cmd /c` wrapping for npm/npx commands

### Global Prompts Management
- Create and manage prompt templates for OpenCode's `AGENTS.md`
- Switch between different prompts with one click
- Auto-backup of current prompt when switching
- Import existing `AGENTS.md` on first launch
- Markdown content support

### Multi-language Support
- English
- 中文 (Chinese)
- 日本語 (Japanese)

### Modern UI
- Dark "Cyber-Industrial" theme with cyan accents
- Glassmorphism design
- Smooth animations with Framer Motion
- Responsive layout

## Installation

### Download
Download the latest release from the [Releases](https://github.com/fengshao1227/Open-Switch/releases) page.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/fengshao1227/Open-Switch.git
cd Open-Switch/open-switch

# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build for production
pnpm build
```

## Development

### Prerequisites
- Node.js 18+
- pnpm
- Rust (for Tauri backend)

### Commands

```bash
# Start development server
pnpm dev

# Type check
pnpm typecheck

# Format code
pnpm format

# Build production
pnpm build
```

### Project Structure

```
open-switch/
├── src/                      # Frontend (React + TypeScript)
│   ├── components/ui/        # shadcn/ui components
│   ├── lib/api.ts            # Tauri IPC wrapper
│   ├── types/                # TypeScript definitions
│   └── i18n/                 # Internationalization
├── src-tauri/                # Backend (Rust)
│   └── src/
│       ├── lib.rs            # Tauri commands
│       ├── config.rs         # OpenCode config management
│       ├── database.rs       # SQLite for prompts
│       ├── prompt.rs         # Prompt data structures
│       └── prompt_service.rs # Prompt business logic
└── README.md
```

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Rust, Tauri 2.x
- **Database**: SQLite (via rusqlite)
- **State Management**: TanStack Query
- **Animations**: Framer Motion
- **i18n**: react-i18next

## Configuration Files

Open Switch manages the following files:

| File | Purpose |
|------|---------|
| `~/.config/opencode/opencode.json` | Main OpenCode configuration |
| `~/.local/share/opencode/auth.json` | API credentials storage |
| `~/.config/opencode/AGENTS.md` | Global prompt file |
| `~/.open-switch/open-switch.db` | Local prompt templates database |

## License

MIT

## Author

**fengshao1227**

- GitHub: [@fengshao1227](https://github.com/fengshao1227)
