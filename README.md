
```markdown
# MGZON CLI 🚀


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

Verify installation:

```bash
mz --version
# or
mgzon --version
```

## 🚀 Quick Start

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

Complete documentation available at: [https://developers.mgzon.com/tools/cli-docs](https://developers.mgzon.com/tools/cli-docs)

- [Getting Started Guide](https://developers.mgzon.com/tools/cli-docs/getting-started)
- [API Reference](https://developers.mgzon.com/tools/cli-docs/api-reference)
- [Examples & Tutorials](https://developers.mgzon.com/tools/cli-docs/examples)
- [Plugin Development](https://developers.mgzon.com/tools/cli-docs/plugins)

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
