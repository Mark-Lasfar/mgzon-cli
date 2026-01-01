# MGZON CLI 🚀

<p align="center">
  <img src="./assets/icon_1024x1024.png" alt="MGZON Logo" width="200" />
</p>

<div align="center">

```
  __  __    ____   _____   ___    _   _      ____   _       ___ 
 |  \/  |  / ___| |__  /  / _ \  | \ | |    / ___| | |     |_ _|
 | |\/| | | |  _    / /  | | | | |  \| |   | |     | |      | | 
 | |  | | | |_| |  / /_  | | | | | |\  |   | |___  | |___   | | 
 |_|  |_|  \____| /____|  \___/  |_| \_|    \____| |_____| |___|
```

**The official Command Line Interface for MGZON App Development Platform**

---

</div>

<p align="center">
  <a href="https://github.com/Mark-Lasfar/mgzon-cli/releases">
    <img src="https://raw.githubusercontent.com/Mark-Lasfar/mgzon-cli/refs/heads/master/assets/CLI.png" alt="MGZON CLI" width="100%" style="max-width: 600px; border-radius: 8px;" />
  </a>
</p>

<p align="center">
  
![License](https://img.shields.io/npm/l/@mg-cli/cli.svg)
![Version](https://img.shields.io/npm/v/@mg-cli/cli.svg)
![Node Version](https://img.shields.io/node/v/@mg-cli/cli)
![GitHub Release](https://img.shields.io/github/v/release/Mark-Lasfar/mgzon-cli)
![Downloads](https://img.shields.io/npm/dm/@mg-cli/cli.svg)
![Build Status](https://github.com/Mark-Lasfar/mgzon-cli/actions/workflows/publish.yml/badge.svg)

</p>

## 📦 Installation

### Option 1: Install via npm (Recommended for developers)

Install globally using npm:

```bash
npm install -g @mg-cli/cli
```

Verify installation:

```bash
mz --version
# or
mgzon --version
```

**Output:** `MGZON CLI v2.0.8`

### Option 2: Standalone Executables (No Node.js required)

Download pre-built binaries for your platform from [GitHub Releases](https://github.com/Mark-Lasfar/mgzon-cli/releases):

#### Linux (x64)
```bash
# Download
curl -LO https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v2.0.8/mgzon-linux

# Make executable
chmod +x mgzon-linux

# Move to PATH (optional)
sudo mv mgzon-linux /usr/local/bin/mgzon

# Verify
./mgzon-linux --version
```

#### macOS (x64)
```bash
# Download
curl -LO https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v2.0.8/mgzon-macos

# Make executable
chmod +x mgzon-macos

# Move to PATH (optional)
sudo mv mgzon-macos /usr/local/bin/mgzon

# Verify
./mgzon-macos --version
```

#### Windows (x64)
```powershell
# Download manually from GitHub Releases or use PowerShell:
Invoke-WebRequest -Uri "https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v2.0.8/mgzon-win.exe" -OutFile "mgzon.exe"

# Run from PowerShell or Command Prompt
.\mgzon.exe --version
```

### Option 3: Docker

```bash
# Run directly
docker run --rm ghcr.io/mark-lasfar/mgzon-cli:latest --version

# Or pull and use
docker pull ghcr.io/mark-lasfar/mgzon-cli:latest
docker run --rm ghcr.io/mark-lasfar/mgzon-cli:latest --help
```

### Option 4: GUI Application (Desktop Interface)

For users who prefer a graphical interface, download the MGZON GUI app:

- **Linux**: [Download AppImage](https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v2.0.8/MGZON%20GUI-2.0.8.AppImage)
- **macOS**: Coming soon (requires macOS runner)
- **Windows**: Coming soon (requires Windows runner)

#### Running the GUI on Linux

```bash
# Download
curl -LO "https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v2.0.8/MGZON GUI-2.0.8.AppImage"

# Make executable
chmod +x "MGZON GUI-2.0.8.AppImage"

# Run
./"MGZON GUI-2.0.8.AppImage"
```

#### GUI Features

- **Dashboard**: Quick access to common actions and system status
- **Project Management**: Create, open, and manage MGZON projects
- **App Management**: List, create, and manage your applications
- **File Storage**: Upload and manage files in MGZON storage
- **Settings**: Configure authentication, CLI settings, and preferences
- **Terminal Output**: Real-time command execution feedback

The GUI automatically bundles the CLI executable for seamless operation.

## 🚀 Quick Start

### 1. Login to MGZON

```bash
mz login
# Follow the prompts or use API key
```

### 2. Create a New App

```bash
mz init my-mgzon-app --template=nextjs
```

### 3. Develop Locally

```bash
cd my-mgzon-app
npm install
mz serve
# App available at http://localhost:3000
```

### 4. Deploy to Production

```bash
mz deploy --env=production
```

## 🔧 Core Commands

### 🏗️ Project Management
| Command | Description | Options |
|---------|-------------|---------|
| `mz init [name]` | Create new MGZON app | `--template` (nextjs, react, vue, static, ecommerce) |
| `mz serve` | Start development server | `--port`, `--host`, `--watch` |
| `mz build` | Build for production | `--analyze`, `--minify` |
| `mz deploy` | Deploy to MGZON cloud | `--env`, `--build`, `--app-id` |

### 🔐 Authentication
| Command | Description |
|---------|-------------|
| `mz login` | Login with API key |
| `mz logout` | Logout from session |
| `mz whoami` | Show current user info |
| `mz setup` | First-time setup wizard |

### 📊 App Management
| Command | Description |
|---------|-------------|
| `mz apps --list` | List your apps |
| `mz apps --create <name>` | Create new app |
| `mz apps --info <id>` | Show app details |
| `mz apps --logs <id>` | View app logs |

### 🔑 API Key Management
| Command | Description |
|---------|-------------|
| `mz keys --list` | List API keys |
| `mz keys --generate` | Generate new key |
| `mz keys --revoke <id>` | Revoke API key |

### ⚙️ Configuration
| Command | Description |
|---------|-------------|
| `mz config --list` | Show all configs |
| `mz config --set key=value` | Set configuration |
| `mz config --get key` | Get configuration |

### 🛠️ Development Tools
| Command | Description |
|---------|-------------|
| `mz generate <type>` | Generate code (component, page, model) |
| `mz webhook` | Manage webhooks |
| `mz db --migrate` | Run database migrations |
| `mz storage` | File storage operations |

### 📦 Additional Commands
| Command | Description |
|---------|-------------|
| `mz docs` | Open documentation |
| `mz support` | Show support options |
| `mz update` | Update CLI to latest version |
| `mz debug` | Debug tools |

## 🎨 Available Templates

```bash
# Next.js with TypeScript + Tailwind (Recommended)
mz init my-app --template=nextjs

# React with Vite + TypeScript
mz init my-app --template=react

# Vue.js 3 with Vite
mz init my-app --template=vue

# Static HTML/CSS/JS
mz init my-app --template=static

# E-commerce with Stripe
mz init my-app --template=ecommerce
```

## ⚙️ Configuration & Environment

### Environment Variables

```bash
# Set API key
export MGZON_API_KEY="your-api-key-here"

# Set custom API URL
export MGZON_API_URL="https://api.mgzon.com/v1"
```

### Configuration File
The CLI automatically creates `~/.mgzon/config.json`:

```json
{
  "apiKey": "your-api-key",
  "apiUrl": "https://api.mgzon.com/v1",
  "defaultEnvironment": "development",
  "userId": "user-123",
  "email": "user@example.com",
  "theme": "default"
}
```

### Project Configuration
Create `.mgzon.json` in your project root:

```json
{
  "projectId": "proj_123",
  "name": "My Awesome App",
  "version": "1.0.0",
  "environment": "development",
  "features": ["authentication", "database", "storage"]
}
```

## 🐳 Docker Usage

### Quick Test
```bash
docker run --rm ghcr.io/mark-lasfar/mgzon-cli:latest --version
```

### Development with Docker
```bash
# Build image locally
docker build -t mgzon-cli:local .

# Run with volume mounting
docker run -it --rm -v $(pwd):/app mgzon-cli:local init my-app

# Run with environment variables
docker run -it --rm \
  -e MGZON_API_KEY="your-key" \
  ghcr.io/mark-lasfar/mgzon-cli:latest whoami
```

## 🛠️ Development & Contribution

### Building from Source

```bash
# Clone repository
git clone https://github.com/Mark-Lasfar/mgzon-cli.git
cd mgzon-cli

# Install dependencies
npm ci

# Build CLI
npm run build
npm run package

# Build GUI (Linux only in Codespaces)
npm run package:gui:linux

# Link for local development
npm link

# Test
./bin/mgzon-linux --version
```

### Project Structure

```
mgzon-cli/
├── src/                    # TypeScript source code
│   ├── commands/          # CLI command implementations
│   ├── middleware/        # Auth and validation middleware
│   ├── utils/             # Utility functions
│   └── index.ts           # Main entry point
├── dist/                  # Compiled JavaScript
├── bin/                   # Standalone binaries
│   ├── mgzon-linux       # Linux executable
│   ├── mgzon-macos       # macOS executable
│   ├── mgzon-win.exe     # Windows executable
│   └── gui/              # GUI application files
├── gui/                   # Electron GUI application
│   ├── src/              # GUI source code
│   ├── build/            # Built GUI files
│   └── package.json      # GUI package config
├── scripts/               # Build and utility scripts
├── .github/workflows/     # CI/CD automation
├── assets/                # Logos and images
└── docs/                  # Documentation
```

### Available NPM Scripts

```bash
# Development
npm run build              # Compile TypeScript
npm run dev                # Run in development mode
npm run test               # Run tests

# Packaging
npm run package            # Build CLI binaries
npm run package:gui:linux  # Build GUI for Linux
npm run package:gui:mac    # Build GUI for macOS
npm run package:gui:win    # Build GUI for Windows

# Maintenance
npm run lint              # Lint code
npm run format            # Format code
npm run update:all        # Update all dependencies
npm run fix:deps          # Fix dependencies for pkg
npm run audit:fix         # Fix security vulnerabilities

# Docker
npm run test:docker       # Test Docker build
```

## 🔄 CI/CD Automation

This project uses GitHub Actions for automated:

- ✅ **Automatic version bumping** on push to master
- ✅ **Binary building** for all platforms (Linux, macOS, Windows)
- ✅ **GUI building** for Linux (AppImage)
- ✅ **Docker image building** and publishing to GitHub Container Registry
- ✅ **NPM package publishing** to npmjs.org
- ✅ **Release creation** with checksums
- ✅ **Dependency security scanning**

Workflows are configured in `.github/workflows/`:
- `publish.yml` - Main build and publish workflow
- `release-binaries.yml` - Multi-platform binary builds
- `docker-image.yml` - Docker build and test
- `publish-docker.yml` - Docker image publishing

## 🐛 Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **"Command not found"** | Ensure `npm global bin` is in PATH: `export PATH="$PATH:$(npm get prefix)/bin"` |
| **"Cannot find module 'axios'"** | Run `npm run fix:deps` to install compatible version |
| **Authentication errors** | Clear config: `rm ~/.mgzon/config.json` and login again |
| **Binary not working** | Verify checksum: `sha256sum mgzon-linux` |
| **GUI not launching** | Ensure AppImage is executable: `chmod +x *.AppImage` |
| **Docker connection** | Check Docker daemon: `docker ps` |

### Debug Mode

```bash
# Enable verbose logging
DEBUG=mgzon:* mz <command>

# Or set environment variable
export DEBUG=mgzon:*
mz whoami
```

### Getting Help

```bash
# Show help for any command
mz --help
mz <command> --help

# Check version info
mz --version

# Open documentation
mz docs

# Contact support
mz support
```

## 📚 Documentation

- **[GitHub Repository](https://github.com/Mark-Lasfar/mgzon-cli)** - Source code and issues
- **[GitHub Releases](https://github.com/Mark-Lasfar/mgzon-cli/releases)** - Download binaries
- **[NPM Package](https://www.npmjs.com/package/@mgzon/cli)** - Package details
- **[GitHub Container Registry](https://github.com/Mark-Lasfar/mgzon-cli/pkgs/container/mgzon-cli)** - Docker images

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup

```bash
# 1. Clone and setup
git clone https://github.com/Mark-Lasfar/mgzon-cli.git
cd mgzon-cli
npm ci

# 2. Build and test
npm run build
npm run package
./bin/mgzon-linux --version

# 3. Make changes and test
npm run test

# 4. Submit PR
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

For security issues, please review our [Security Policy](SECURITY.md) and report vulnerabilities responsibly.

## 📞 Support & Community

- **GitHub Issues**: [Report bugs](https://github.com/Mark-Lasfar/mgzon-cli/issues)
- **Email**: dev@mgzon.com
- **Documentation**: [README](README.md) and [docs/](docs/)
- **CI/CD Status**: [GitHub Actions](https://github.com/Mark-Lasfar/mgzon-cli/actions)

---

<div align="center">

**Made with ❤️ by the MGZON Team**

[![Star History Chart](https://api.star-history.com/svg?repos=Mark-Lasfar/mgzon-cli&type=Date)](https://star-history.com/#Mark-Lasfar/mgzon-cli&Date)

</div>
