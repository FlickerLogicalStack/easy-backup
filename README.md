# Easy Backup

A lightweight, automated backup solution with client-server architecture built on Bun runtime. Easy Backup provides scheduled, compressed, and optionally encrypted backups from clients to multiple server endpoints.

## Features

- **Automated Scheduling**: Cron-based backup scheduling with optional immediate execution on startup
- **Multi-Server Support**: Upload backups to multiple servers for redundancy
- **Smart File Filtering**: Include/exclude files using glob patterns
- **Compression**: ZIP compression with optional password protection
- **Cross-Platform**: Supports Linux, macOS, and Windows (x64 and ARM64)
- **Simple Configuration**: JSON-based configuration files
- **Server-Side Validation**: API key authentication for secure uploads

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Backup Client │───────▶│   Backup Server │
│                 │         │                 │
│  • Scan files   │         │  • Receive      │
│  • Compress     │         │  • Validate key  │
│  • Schedule     │         │  • Store        │
└─────────────────┘         └─────────────────┘
         │                           │
         │                           │
         └───────────────────────────┘
              Multiple servers supported
```

## Quick Install

Download and install the latest release:

```bash
bash <(curl -s https://raw.githubusercontent.com/FlickerLogicalStack/easy-backup/refs/heads/master/download.sh)
```

This will automatically detect your platform and download the appropriate binaries.

## Prerequisites

- [Bun](https://bun.sh) runtime (for development/source usage)

## Usage

### Running from Source

**Start the Server:**

```bash
bun ./server/server.ts -c configs/server.gitignore.json
```

**Start the Client:**

```bash
bun ./client/client.ts configs/client.gitignore.json
```

### Using Compiled Binaries

After downloading or building, use the compiled binaries:

```bash
./easy-backup-server-darwin-arm64 --config server-config.json
./easy-backup-client-darwin-arm64 client-config.json
```

## Configuration

### Server Configuration

Create a JSON configuration file for the server:

```json
{
  "name": "backup-server-1",
  "server": {
    "port": 8091,
    "root_folder": "/path/to/backup/storage",
    "key": "your-secret-api-key"
  }
}
```

**Parameters:**
- `name`: Server identifier
- `server.port`: Port to listen on
- `server.root_folder`: Directory where backups will be stored
- `server.key`: API key for authenticating clients (passed via `X-Key` header)

### Client Configuration

Create a JSON configuration file for the client:

```json
{
  "name": "my-client",
  "servers": {
    "server-1": {
      "ip": "192.168.1.100",
      "port": 8091,
      "key": "your-secret-api-key"
    },
    "server-2": {
      "ip": "192.168.1.101",
      "port": 8091,
      "key": "another-secret-key"
    }
  },
  "backups": {
    "documents": {
      "directory": "/home/user/documents",
      "cron": "0 2 * * *",
      "servers": ["server-1", "server-2"],
      "password": "optional-zip-password",
      "include": ["**/*.pdf", "**/*.docx"],
      "exclude": ["**/temp/**", "**/.cache/**"],
      "on_start": true
    }
  }
}
```

**Parameters:**

- `name`: Client identifier
- `servers`: Map of server configurations
  - `ip`: Server IP address
  - `port`: Server port
  - `key`: API key matching server's key
- `backups`: Map of backup jobs
  - `directory`: Directory to back up
  - `cron`: Cron expression for scheduling (e.g., `0 2 * * *` for daily at 2 AM)
  - `servers`: Array of server names to upload to
  - `password` (optional): Password for ZIP encryption
  - `include` (optional): Glob patterns for files to include
  - `exclude` (optional): Glob patterns for files to exclude
  - `on_start` (optional): Run backup immediately on client start

## Building from Source

### Build for Specific Platforms

```bash
./build.sh linux-x64-modern darwin-arm64
```

### Available Targets

**Linux:**
- `linux-x64`, `linux-x64-baseline`, `linux-x64-modern`
- `linux-x64-musl-baseline`, `linux-x64-musl-modern`
- `linux-arm64`, `linux-arm64-musl`

**Windows:**
- `windows-x64`, `windows-x64-baseline`, `windows-x64-modern`

**macOS:**
- `darwin-x64`, `darwin-x64-baseline`, `darwin-x64-modern`
- `darwin-arm64`

### Create Release

```bash
./release.sh
```

This creates a GitHub release with compiled binaries for major platforms.

### Version Management

Bump the patch version:

```bash
./patch.sh
```

## How It Works

1. **Server** starts and listens for HTTP POST requests at `/upload/` endpoint
2. **Client** reads its configuration and initializes backup jobs
3. Each backup job runs on its cron schedule (or on start if `on_start: true`)
4. When triggered, the client:
   - Scans the directory using include/exclude glob patterns
   - Compresses matched files into a ZIP archive (optionally password-protected)
   - Pings configured servers to check availability
   - Uploads the ZIP to all alive servers
5. **Server** validates the API key and saves the upload to `{root_folder}/{client_name}/{backup_name}.zip`

## Logging

Logs are written to `./logs/` directory with separate files for server and client:
- `server_YYYY.MM.DD.log`
- `client_YYYY.MM.DD.log`

Set `CONSOLE_DISABLED` environment variable to disable console output.

## Dependencies

- **Compression**: [@zip.js/zip.js](https://github.com/gildas-lormeau/zip.js)
