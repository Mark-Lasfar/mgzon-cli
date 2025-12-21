# MGZON CLI Documentation

Welcome to the MGZON CLI documentation. This comprehensive guide covers everything you need to know about installing, using, and understanding the MGZON Command Line Interface and Graphical User Interface.

## Repository Boundary: Public vs Private

### Public Repository (This Repository)
**Contains:**
- ✅ User installation guides and binaries
- ✅ API interface definitions (types only)
- ✅ Usage examples and workflows
- ✅ Architecture diagrams and explanations
- ✅ Troubleshooting guides
- ✅ Release notes and changelogs

**Does NOT contain:**
- ❌ Source code implementations
- ❌ Authentication logic
- ❌ API client code
- ❌ Internal business logic
- ❌ Database schemas
- ❌ Security credentials
- ❌ Build scripts and CI/CD configurations

### Private Repository (mgzon-cli-core)
**Contains:**
- Source code implementations
- Internal build and deployment scripts
- Authentication and security logic
- API integration code
- Database configurations
- Test suites with real credentials
- Internal documentation for developers

### Boundary Enforcement
- **Code Reviews**: All public repository changes reviewed for sensitive content
- **Automated Checks**: CI/CD pipelines scan for accidental exposure
- **Access Controls**: Private repository restricted to authorized developers
- **Documentation Reviews**: Ensure docs don't reveal implementation details

## Quick Start

- [Installation Guide](installation.mdx) - How to install MGZON CLI and GUI
- [User Flow Guide](user-flow.mdx) - Step-by-step workflows
- [End-to-End Flow](end-to-end-flow.mdx) - Complete user journey
- [Architecture Diagram](architecture-diagram.md) - High-level system overview

## Detailed Documentation

### For CLI Users
- Command reference and examples
- Configuration options
- Troubleshooting guide

### For GUI Users
- Interface overview
- Feature explanations
- Integration details

### For Developers
- [GUI-Backend Interaction](gui-backend-interaction.mdx) - How components communicate
- API integration patterns
- Extension development

## Architecture

### System Components
- CLI command processor
- GUI desktop application
- API communication layer
- Authentication system

### Data Flow
- User input processing
- Command execution
- API interactions
- Response handling

## Security & Privacy

For information about our security practices and privacy protection measures, see our [Privacy & Security Implementation Plan](../PRIVACY_SECURITY_PLAN.md).

## Support

- [GitHub Issues](https://github.com/Mark-Lasfar/mgzon-cli/issues) - Report bugs and request features
- [Documentation Issues](https://github.com/Mark-Lasfar/mgzon-cli/issues) - Report documentation problems
- Community Discord - Get help from the community

## Contributing

We welcome contributions to our documentation! Please see our contributing guide for details on how to help improve the MGZON CLI documentation.


---
title: Installation Guide
description: How to install MGZON CLI and GUI applications
---

# Installation Guide

MGZON provides multiple installation options to suit different user preferences and system requirements.

## Prerequisites

- **Operating System**: Linux, macOS, or Windows
- **For NPM installation**: Node.js 16.0.0+ and npm 7.0.0+

## Installation Options

### Option 1: NPM Package (Recommended for Developers)

The NPM package provides the most up-to-date version and integrates well with Node.js development workflows.

```bash
# Install globally
npm install -g @mgzon/cli

# Verify installation
mz --version
```

**Pros:**
- Automatic updates via npm
- Integrates with existing Node.js toolchain
- Access to latest features immediately

**Cons:**
- Requires Node.js installation
- May have slower startup on some systems

### Option 2: Standalone Executables

Pre-compiled binaries that bundle Node.js runtime - no additional dependencies required.

#### Linux
```bash
# Download the executable
curl -L https://github.com/Mark-Lasfar/mgzon-cli/releases/latest/download/mgzon-linux -o mgzon

# Make executable and move to PATH
chmod +x mgzon
sudo mv mgzon /usr/local/bin/
```

#### macOS
```bash
# Download the executable
curl -L https://github.com/Mark-Lasfar/mgzon-cli/releases/latest/download/mgzon-macos -o mgzon

# Make executable and move to PATH
chmod +x mgzon
sudo mv mgzon /usr/local/bin/
```

#### Windows
1. Download `mgzon-win.exe` from the latest release
2. Add the executable to your system PATH, or
3. Run directly from the download location

**Pros:**
- No Node.js dependency
- Faster startup times
- Portable across systems

**Cons:**
- Manual update process
- Larger file sizes due to bundled runtime

### Option 3: GUI Application

Full-featured desktop application with graphical interface.

#### Linux
```bash
# Download and run the AppImage
curl -L https://github.com/Mark-Lasfar/mgzon-cli/releases/latest/download/MGZON-GUI-1.0.0.AppImage -o mgzon-gui.AppImage
chmod +x mgzon-gui.AppImage
./mgzon-gui.AppImage
```

#### macOS
1. Download the `.dmg` file from releases
2. Open the DMG and drag MGZON GUI to Applications
3. Launch from Applications folder

#### Windows
1. Download the `.exe` installer from releases
2. Run the installer
3. Launch MGZON GUI from Start Menu

**Pros:**
- User-friendly graphical interface
- Integrated terminal output
- File/folder selection dialogs

**Cons:**
- Larger download size
- Requires more system resources

## Post-Installation Setup

### First-Time Configuration

1. **Verify Installation**
   ```bash
   mz --version
   # Should display version information
   ```

2. **Authenticate**
   ```bash
   mz login
   # Follow the authentication prompts
   ```

3. **Check Status**
   ```bash
   mz whoami
   # Should show your account information
   ```

### Environment Configuration

Create a global configuration file at `~/.mgzonrc`:

```json
{
  "defaultOrganization": "your-org",
  "defaultEnvironment": "development",
  "theme": "dark"
}
```

Or set environment variables:
```bash
export MGZON_API_KEY="your-api-key"
export MGZON_PROJECT_ID="your-project-id"
```

## Troubleshooting Installation

### Common Issues

**"Command not found" after npm install**
```bash
# Add npm global bin to PATH
export PATH="$PATH:$(npm config get prefix)/bin"
```

**Permission errors on Linux/macOS**
```bash
# Use sudo for system-wide installation
sudo npm install -g @mgzon/cli
```

**Antivirus blocking executable**
- Add exceptions for MGZON executables in your antivirus software
- Download from official GitHub releases only

### Verification Commands

```bash
# Check CLI version
mz --version

# Test basic functionality
mz --help

# Verify authentication
mz whoami
```

## Updating

### NPM Installation
```bash
npm update -g @mgzon/cli
```

### Standalone Executables
Download the latest release from GitHub and replace the existing executable.

### GUI Application
The GUI includes an update checker - use the "Check for Updates" button in Settings.