
```markdown
# MGZON CLI 🚀

   <p align="center">
   <img src="./assets/icon_1024x1024.png" alt="MGZON Logo" width="200" />
   </p>


![MGZON CLI](https://raw.githubusercontent.com/Mark-Lasfar/mgzon-cli/c6f01cda372f6c9bffb325467dd2db26e3a3aeac/assets/mg.svg)



  __  __    ____   _____   ___    _   _      ____   _       ___ 
 |  \/  |  / ___| |__  /  / _ \  | \ | |    / ___| | |     |_ _|
 | |\/| | | |  _    / /  | | | | |  \| |   | |     | |      | | 
 | |  | | | |_| |  / /_  | |_| | | |\  |   | |___  | |___   | | 
 |_|  |_|  \____| /____|  \___/  |_| \_|    \____| |_____| |___|
 

The official Command Line Interface for MGZON App Development Platform.

![MGZON CLI](https://img.shields.io/npm/v/@mgzon/cli.svg)
![License](https://img.shields.io/npm/l/@mgzon/cli.svg)
![Downloads](https://img.shields.io/npm/dm/@mgzon/cli.svg)
![Node Version](https://img.shields.io/node/v/@mgzon/cli)

## 📦 Installation

### Option 1: Install via npm (Recommended for developers)

Install globally using npm:

```bash
npm install -g @mgzon/cli
```

Or using yarn:

```bash
yarn global add @mgzon/cli
```

Or using pnpm:

```bash
pnpm add -g @mgzon/cli
```

### Option 2: Standalone Executables (No Node.js required)

Download the pre-built executables for your platform:

#### Linux
```bash
# Download and make executable
curl -L https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v1.0.0/mgzon-linux -o mgzon
chmod +x mgzon
sudo mv mgzon /usr/local/bin/
```

#### macOS
```bash
# Download and make executable
curl -L https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v1.0.0/mgzon-macos -o mgzon
chmod +x mgzon
sudo mv mgzon /usr/local/bin/
```

#### Windows
```bash
# Download from releases page and add to PATH
# https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v1.0.0/mgzon-win.exe
```

Verify installation:

```bash
mz --version
# or
mgzon --version
```

### Option 3: GUI Application

For users who prefer a graphical interface, download the MGZON GUI app:

- **Linux**: [Download AppImage](https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v1.0.0/MGZON.GUI-1.0.0.AppImage)
- **macOS**: [Download DMG](https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v1.0.0/MGZON.GUI-1.0.0.dmg)  
- **Windows**: [Download EXE](https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v1.0.0/MGZON.GUI.exe)

The GUI provides the same functionality as the CLI but with a user-friendly interface.

#### GUI Features

- **Dashboard**: Quick access to common actions and system status
- **Project Management**: Create, open, and manage MGZON projects
- **App Management**: List, create, and manage your applications
- **File Storage**: Upload and manage files in MGZON storage
- **Settings**: Configure authentication, CLI settings, and preferences
- **Terminal Output**: Real-time command execution feedback

The GUI automatically detects and uses the bundled CLI executable for all operations.

#### Running the GUI

**Linux (AppImage):**
```bash
chmod +x MGZON.GUI-1.0.0.AppImage
./MGZON.GUI-1.0.0.AppImage
```

**macOS (DMG):**
Double-click the downloaded DMG file and drag the app to Applications.

**Windows (EXE):**
Double-click the downloaded EXE file to install and run.

## 🚀 Quick Start

### Try the Demo Script

Run the included demo script to see common CLI usage:

```bash
# Make sure you're in the project directory
cd mgzon-cli

# Run the demo
./demo.sh
```

### Manual Quick Start

```bash
# Create a new MGZON app
mz init my-app --template=nextjs

# Navigate to your app
cd my-app

# Install dependencies
npm install

# Start development server
mz serve

# Deploy to MGZON
mz deploy
```

## 🔧 Core Commands

### 🏗️ Project Management
- `mz init [name]` - Create a new MGZON app
- `mz serve` - Start local development server
- `mz build` - Build your app for production
- `mz deploy` - Deploy app to MGZON cloud

### 🔐 Authentication
- `mz login` - Login to your MGZON account
- `mz logout` - Logout from current session
- `mz whoami` - Show current user info

### 🔑 API Management
- `mz keys:list` - List your API keys
- `mz keys:generate` - Generate new API key
- `mz keys:revoke <key-id>` - Revoke an API key

### 📊 App Management
- `mz apps:list` - List your apps
- `mz apps:create <name>` - Create new app
- `mz apps:info <app-id>` - Show app details
- `mz apps:delete <app-id>` - Delete an app

### 📦 Database
- `mz db:create` - Create database schema
- `mz db:migrate` - Run database migrations
- `mz db:seed` - Seed database with sample data

### 📁 File Management
- `mz storage:upload <file>` - Upload file to storage
- `mz storage:list` - List storage files
- `mz storage:delete <file-id>` - Delete file

## 🎨 Templates

Available templates for `mz init`:

```bash
# Next.js template (default)
mz init my-app --template=nextjs

# React template
mz init my-app --template=react

# Vue.js template
mz init my-app --template=vue

# Static site template
mz init my-app --template=static

# E-commerce template
mz init my-app --template=ecommerce
```

## ⚙️ Configuration

### Environment Setup
Create `.mgzonrc` in your project root:

```json
{
  "projectId": "your-project-id",
  "apiKey": "your-api-key",
  "environment": "development"
}
```

Or use environment variables:

```bash
export MGZON_API_KEY="your-api-key"
export MGZON_PROJECT_ID="your-project-id"
```

### Global Configuration
```bash
# Set default organization
mz config:set organization=my-org

# Set default environment
mz config:set environment=staging

# View all configurations
mz config:list
```

## 🔌 Plugins

Extend CLI functionality with plugins:

```bash
# Install plugin
mz plugins:install @mgzon/plugin-analytics

# List installed plugins
mz plugins:list

# Update plugins
mz plugins:update
```

## 🐛 Troubleshooting

### Common Issues

1. **"Command not found" after installation**
   ```bash
   # Add npm global bin to PATH
   export PATH="$PATH:$HOME/.npm-global/bin"
   # For fish shell: set -U fish_user_paths $HOME/.npm-global/bin $fish_user_paths
   ```

2. **Authentication failed**
   ```bash
   # Clear authentication cache
   mz logout
   mz login
   ```

3. **Deployment failed**
   ```bash
   # Check deployment logs
   mz logs --deployment=<deployment-id>
   
   # View build logs
   mz logs --build=<build-id>
   ```

## 🛠️ Development

### Local Development
```bash
# Clone repository
git clone https://github.com/mgzon/mgzon-cli.git
cd mgzon-cli

# Install dependencies
npm install

# Build project
npm run build

# Run demo script
./demo.sh

# Link for local development
npm link

# Run tests
npm test

# Run in development mode
npm run dev -- --help
```

### Project Structure
```
mgzon-cli/
├── src/
│   ├── commands/          # CLI commands
│   ├── lib/              # Core libraries
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   └── index.ts          # Entry point
├── dist/                 # Compiled output
├── tests/                # Test files
└── docs/                 # Documentation
```

## 📚 Documentation

Complete documentation is available in the [docs/](docs/) directory:

- **[Installation Guide](docs/installation.mdx)** - Detailed installation instructions
- **[User Flow Guide](docs/user-flow.mdx)** - Step-by-step user workflows
- **[GUI-Backend Interaction](docs/gui-backend-interaction.mdx)** - How the GUI communicates with services
- **[End-to-End Flow](docs/end-to-end-flow.mdx)** - Complete user journey from installation to execution
- **[Architecture Diagram](docs/architecture-diagram.md)** - High-level system overview

For privacy and security reasons, implementation details are not exposed in this public repository. The documentation provides comprehensive guidance on usage and architecture without revealing sensitive code.

See our [Privacy & Security Implementation Plan](PRIVACY_SECURITY_PLAN.md) for details on our approach to protecting intellectual property and user data.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- 📧 Email: support@mgzon.com
- 🐛 Issues: [GitHub Issues](https://github.com/mgzon/mgzon-cli/issues)
- 💬 Discord: [Join our community](https://discord.gg/mgzon)
- 🐦 Twitter: [@mgzon_dev](https://twitter.com/mgzon_dev)

---

Made with ❤️ by the MGZON Team
```
