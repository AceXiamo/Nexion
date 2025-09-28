# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexion is a next-generation SSH manager powered by Web3 technology. It's built as an Electron desktop application that combines traditional SSH management with blockchain-based configuration storage and Web3 authentication.

## Development Commands

```bash
# Development (runs on testnet by default)
yarn dev

# Development with specific networks
yarn dev:testnet
yarn dev:mainnet

# Build application
yarn build                # Build with testnet
yarn build:testnet        # Build with testnet
yarn build:mainnet        # Build with mainnet

# Linting
yarn lint

# Preview built application
yarn preview
```

## Tech Stack & Architecture

### Core Technologies
- **Frontend**: React 18 + TypeScript + Electron
- **UI Framework**: Tailwind CSS with custom components
- **State Management**: Zustand for client state + React Query for server state
- **Routing**: React Router DOM
- **Build Tool**: Vite with custom Electron plugins

### Web3 Integration
- **Blockchain**: X Layer (OKX Layer2) - supports both testnet and mainnet
- **Wallet Integration**: OKX Wallet + WalletConnect via Wagmi
- **Web3 Libraries**: Wagmi v2 + Viem v2 for Ethereum interactions
- **Encryption**: ECIES + ChaCha20Poly1305 for end-to-end encryption

### SSH & Terminal
- **SSH Client**: ssh2 library for connection management
- **Terminal Emulation**: xterm.js with fit addon
- **PTY**: node-pty for pseudo-terminal interface
- **Session Management**: Custom session store with persistence

## Project Structure

```
src/
├── components/           # React components
│   ├── layout/          # Layout and navigation components
│   ├── ssh/             # SSH connection and terminal components
│   ├── ui/              # Reusable UI components
│   └── wallet/          # Web3 wallet components
├── hooks/               # Custom React hooks
├── services/            # Business logic and external integrations
├── stores/              # Zustand state management
├── types/               # TypeScript type definitions
├── views/               # Main page components
├── lib/                 # Utility functions and configurations
├── locales/             # i18n translation files
└── i18n/                # i18n configuration

electron/                # Electron main process
├── main.ts              # Main Electron process
├── preload.ts           # Preload scripts for renderer
└── ssh-session-manager.ts # SSH session management
```

## Key Architectural Patterns

### State Management
- **Session State**: Terminal sessions managed via `sessionStore` with persistence
- **SSH Configurations**: Stored in `sshConfigStore` with blockchain sync
- **Wallet State**: Web3 wallet connections managed via `walletStore`
- **User Registration**: Blockchain identity management via `userRegistrationStore`

### SSH Architecture
- **SSH Event Dispatcher**: Global event system for SSH connection lifecycle
- **Session Manager**: Handles multiple concurrent SSH sessions
- **Terminal Persistence**: Automatic saving/restoring of terminal sessions
- **Keyboard Shortcuts**: Global shortcuts for terminal and session management

### Network Configuration
- Build-time network selection via `BUILD_NETWORK` environment variable
- Testnet vs Mainnet configurations for blockchain interactions
- Network-specific wallet connectors and contract addresses

## Development Guidelines

### Environment Setup
- Node.js 18+ required
- Uses Yarn as package manager
- ESLint configured with TypeScript and React rules
- Tailwind CSS for styling with custom configuration

### Build Process
- Vite handles the renderer process build
- Electron builder creates platform-specific distributables
- Node.js polyfills enabled for browser compatibility
- External modules (ssh2, node-pty) excluded from bundling

### Platform Support
- Windows: NSIS installer + portable executable
- macOS: DMG package (arm64 only)
- Linux: AppImage, DEB, and RPM packages

### Code Style
- TypeScript strict mode enabled
- Path aliases configured (`@/` maps to `src/`)
- React functional components with hooks
- Zustand for state management over Redux

## Common Development Tasks

### Adding a New SSH Connection Feature
1. Update types in `src/types/ssh.ts`
2. Modify SSH session manager in `electron/ssh-session-manager.ts`
3. Update UI components in `src/components/ssh/`
4. Add state management to relevant stores

### Web3 Integration Changes
1. Update wallet configuration in `src/lib/wallet-config.ts`
2. Modify contract interactions in `src/services/`
3. Update blockchain-related types in `src/types/`
4. Test with both testnet and mainnet configurations

### Terminal Enhancements
1. Terminal components are in `src/components/TerminalContainer.tsx`
2. Session management via `src/store/session-store.ts`
3. Keyboard shortcuts in `src/hooks/useKeyboardShortcuts.ts`
4. Persistence logic in `src/services/terminal-persistence-manager.ts`