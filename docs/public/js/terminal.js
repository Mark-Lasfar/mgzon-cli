// Real Terminal Implementation
class RealTerminal {
    constructor() {
        this.outputElement = document.getElementById('terminal-output');
        this.inputElement = document.getElementById('terminal-input');
        this.runButton = document.getElementById('terminal-run');
        this.clearButton = document.getElementById('clear-terminal');
        this.copyButton = document.getElementById('copy-terminal');
        this.statusElement = document.getElementById('terminal-status');
        
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentDirectory = '~';
        
        this.init();
    }
    
    init() {
        console.log('Terminal initializing...');
        
        // Add event listeners
        this.inputElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.runButton.addEventListener('click', () => this.executeCommand());
        this.clearButton.addEventListener('click', () => this.clearTerminal());
        this.copyButton.addEventListener('click', () => this.copyTerminal());
        
        // Focus input
        this.inputElement.focus();
        
        // Print welcome message
        this.printWelcome();
        
        console.log('✅ Terminal ready');
    }
    
    printWelcome() {
        const welcome = `Welcome to MGZON CLI Terminal Simulator v2.0.8

Type 'help' to see available commands
Type 'clear' to clear the terminal
Use ↑/↓ for command history, Tab for auto-complete

`;
        this.print(welcome, 'output');
        
        // Show initial prompt
        this.printPrompt();
    }
    
    printPrompt() {
        const prompt = `\n${this.currentDirectory} $ `;
        this.print(prompt, 'prompt');
    }
    
    async executeCommand() {
        const command = this.inputElement.value.trim();
        if (!command) return;
        
        // Add to history
        this.commandHistory.push(command);
        this.historyIndex = this.commandHistory.length;
        
        // Show command
        this.print(`${this.currentDirectory} $ ${command}`, 'command');
        
        // Clear input
        this.inputElement.value = '';
        
        // Update status
        this.statusElement.textContent = '● Processing...';
        this.statusElement.style.color = '#f59e0b';
        
        // Execute command with delay to simulate processing
        setTimeout(async () => {
            await this.processCommand(command.toLowerCase());
            
            // Update status
            this.statusElement.textContent = '● Ready';
            this.statusElement.style.color = '#10b981';
            
            // Show prompt for next command
            this.printPrompt();
            
            // Scroll to bottom
            this.outputElement.scrollTop = this.outputElement.scrollHeight;
        }, 300);
    }
    
    async processCommand(fullCommand) {
        const [command, ...args] = fullCommand.split(' ');
        
        try {
            switch(command) {
                case 'help':
                    await this.showHelp();
                    break;
                case 'version':
                    await this.showVersion();
                    break;
                case 'login':
                    await this.simulateLogin(args);
                    break;
                case 'whoami':
                    await this.showWhoami();
                    break;
                case 'init':
                    await this.simulateInit(args);
                    break;
                case 'deploy':
                    await this.simulateDeploy(args);
                    break;
                case 'apps':
                    await this.simulateApps(args);
                    break;
                case 'keys':
                    await this.simulateKeys(args);
                    break;
                case 'config':
                    await this.simulateConfig(args);
                    break;
                case 'serve':
                    await this.simulateServe(args);
                    break;
                case 'build':
                    await this.simulateBuild(args);
                    break;
                case 'clear':
                    this.clearTerminal();
                    break;
                case 'ls':
                    this.print('README.md\npackage.json\nsrc/\npublic/\ndist/\n', 'output');
                    break;
                case 'pwd':
                    this.print(this.currentDirectory, 'output');
                    break;
                case 'echo':
                    this.print(args.join(' '), 'output');
                    break;
                default:
                    this.print(`Command not found: ${command}`, 'error');
                    this.print(`Type 'help' for available commands`, 'output');
            }
        } catch (error) {
            this.print(`Error: ${error.message}`, 'error');
        }
    }
    
    async showHelp() {
        const help = await this.fetchCLIHelp();
        this.print(help, 'output');
    }
    
    async fetchCLIHelp() {
        try {
            // Try to get help from API
            const response = await fetch('/api/cli/help');
            if (response.ok) {
                return await response.text();
            }
        } catch (error) {
            console.log('Using fallback help:', error);
        }
        
        // Fallback help
        return `MGZON CLI v2.0.8 - Available Commands:

Project Management:
  init [name]          Create a new MGZON app
  serve                Start development server
  build                Build for production
  deploy               Deploy to MGZON cloud

Authentication:
  login                Login to MGZON
  whoami               Show current user info

App Management:
  apps --list          List your apps
  apps --create <name> Create new app

API Management:
  keys --list          List API keys
  keys --generate      Generate new API key

Configuration:
  config --list        Show configuration
  config --set key=value Set configuration

Development:
  generate <type>      Generate code (component, page, model)

Utilities:
  version              Show CLI version
  help                 Show this help
  clear                Clear terminal

Examples:
  mz init my-app --template=nextjs
  mz deploy --env=production
  mz keys --generate

For more details: mz <command> --help
`;
    }
    
    async showVersion() {
        try {
            const response = await fetch('/api/cli/version');
            if (response.ok) {
                const data = await response.json();
                this.print(`MGZON CLI ${data.version}`, 'success');
                this.print(`Node.js ${process.version}`, 'output');
                this.print(`Platform: ${navigator.platform}`, 'output');
            } else {
                this.print('MGZON CLI v2.0.8', 'success');
            }
        } catch {
            this.print('MGZON CLI v2.0.8', 'success');
        }
    }
    
    async simulateLogin(args) {
        const apiKey = args[0];
        
        if (!apiKey) {
            this.print('🔐 MGZON CLI Authentication', 'output');
            this.print('', 'output');
            this.print('Please enter your API key:', 'output');
            this.print('Demo API key: sk_test_123456789', 'output');
            
            // Simulate interactive input
            const fakeApiKey = 'sk_test_123456789';
            
            this.print(`\nAPI Key: ${'*'.repeat(fakeApiKey.length)}`, 'output');
            
            await this.delay(1000);
            this.print('🔐 Connecting to MGZON API...', 'output');
            
            await this.delay(1500);
            this.print('✅ Authentication successful!', 'success');
            this.print('👤 Welcome back, developer!', 'output');
            this.print('🆔 User ID: user_123456789', 'output');
            this.print('🎯 Role: Developer', 'output');
            this.print('🏢 Organization: MGZON Team', 'output');
            this.print('📊 Plan: Pro', 'output');
        } else {
            this.print(`Logging in with API key: ${apiKey.substring(0, 8)}...`, 'output');
            
            await this.delay(2000);
            this.print('✅ Login successful!', 'success');
        }
    }
    
    async showWhoami() {
        this.print('👤 Current User Information:', 'output');
        this.print('📧 Email: developer@mgzon.com', 'output');
        this.print('🆔 User ID: user_123456789', 'output');
        this.print('🎯 Role: Developer', 'output');
        this.print('🏢 Organization: MGZON Team', 'output');
        this.print('📊 Plan: Pro', 'output');
        this.print('📈 API Rate Limit: 1000 requests/hour', 'output');
        this.print('💾 Storage Used: 245 MB / 10 GB', 'output');
        this.print('📁 Projects: 3 active', 'output');
        this.print('🕐 Last Login: Just now', 'output');
    }
    
    async simulateInit(args) {
        const projectName = args[0] || 'my-app';
        const hasTemplate = args.find(arg => arg.startsWith('--template='));
        const template = hasTemplate ? hasTemplate.split('=')[1] : 'nextjs';
        
        this.print(`🚀 Creating new MGZON project: ${projectName}`, 'output');
        await this.delay(500);
        
        this.print(`📦 Template: ${template}`, 'output');
        await this.delay(300);
        
        this.print('🔧 Setting up project structure...', 'output');
        await this.delay(400);
        
        this.print('📝 Creating configuration files...', 'output');
        await this.delay(300);
        
        this.print('📁 Initializing git repository...', 'output');
        await this.delay(400);
        
        this.print('📦 Installing dependencies...', 'output');
        await this.delay(800);
        
        this.print('✅ Project created successfully!', 'success');
        
        this.print('\n🚀 Next steps:', 'output');
        this.print(`   cd ${projectName}`, 'output');
        this.print('   npm install', 'output');
        this.print('   mz serve', 'output');
        
        this.print('\n🌐 Your app will be available at: http://localhost:3000', 'output');
    }
    
    async simulateDeploy(args) {
        const hasEnv = args.find(arg => arg.startsWith('--env='));
        const env = hasEnv ? hasEnv.split('=')[1] : 'production';
        
        this.print(`🚀 Starting deployment to ${env}...`, 'output');
        await this.delay(600);
        
        this.print('📦 Building application (Webpack 5.89.0)...', 'output');
        await this.delay(700);
        
        this.print('✅ Build completed successfully', 'success');
        await this.delay(400);
        
        this.print('☁️  Uploading to MGZON Cloud...', 'output');
        await this.delay(800);
        
        this.print('✅ Upload completed', 'success');
        await this.delay(300);
        
        this.print('🔗 Creating CDN distribution...', 'output');
        await this.delay(500);
        
        this.print('🔐 Setting up SSL certificate...', 'output');
        await this.delay(400);
        
        this.print('⚡ Configuring load balancer...', 'output');
        await this.delay(300);
        
        this.print('✅ Deployment successful! 🎉', 'success');
        
        this.print(`\n🌐 Your app is now live at: https://${env}.mgzon.com`, 'output');
        this.print('📊 Dashboard: https://dashboard.mgzon.com/apps', 'output');
        this.print('📋 Logs: https://logs.mgzon.com/${env}', 'output');
        
        this.print('\n📦 Deployment Details:', 'output');
        this.print('   ID: deploy_' + Date.now(), 'output');
        this.print('   Status: Active', 'output');
        this.print('   Region: us-east-1', 'output');
        this.print('   Instance: t3.medium', 'output');
    }
    
    async simulateApps(args) {
        if (args.includes('--list')) {
            this.print('📱 Your MGZON Applications:', 'output');
            this.print('', 'output');
            this.print('1. ecommerce-store', 'output');
            this.print('   🟢 Active | production', 'output');
            this.print('   URL: https://store.mgzon.com', 'output');
            this.print('   ID: app_1a2b3c4d', 'output');
            this.print('', 'output');
            
            this.print('2. admin-dashboard', 'output');
            this.print('   🟡 Building | staging', 'output');
            this.print('   URL: https://staging-admin.mgzon.com', 'output');
            this.print('   ID: app_5e6f7g8h', 'output');
            this.print('', 'output');
            
            this.print('3. api-gateway', 'output');
            this.print('   🔴 Error | development', 'output');
            this.print('   URL: https://dev-api.mgzon.com', 'output');
            this.print('   ID: app_9i0j1k2l', 'output');
            this.print('', 'output');
            
            this.print('Total: 3 applications', 'output');
            this.print('Active: 2 | Building: 1 | Error: 1', 'output');
        } else {
            this.print('📱 Apps command usage:', 'output');
            this.print('   apps --list          List all applications', 'output');
            this.print('   apps --create <name> Create new application', 'output');
            this.print('   apps --info <id>    Show application details', 'output');
            this.print('   apps --logs <id>    View application logs', 'output');
            this.print('   apps --delete <id>  Delete application', 'output');
        }
    }
    
    async simulateKeys(args) {
        if (args.includes('--list')) {
            this.print('🔑 Your API Keys:', 'output');
            this.print('', 'output');
            this.print('1. Production Key', 'output');
            this.print('   ID: key_prod_abc123', 'output');
            this.print('   Name: Production Server', 'output');
            this.print('   Created: 2024-01-10', 'output');
            this.print('   Last Used: 2 hours ago', 'output');
            this.print('', 'output');
            
            this.print('2. Development Key', 'output');
            this.print('   ID: key_dev_xyz789', 'output');
            this.print('   Name: Local Development', 'output');
            this.print('   Created: 2024-01-20', 'output');
            this.print('   Last Used: 5 minutes ago', 'output');
            this.print('', 'output');
            
            this.print('3. CI/CD Key', 'output');
            this.print('   ID: key_cicd_456def', 'output');
            this.print('   Name: GitHub Actions', 'output');
            this.print('   Created: 2024-01-25', 'output');
            this.print('   Last Used: 1 day ago', 'output');
        } else if (args.includes('--generate')) {
            this.print('🔑 Generating new API key...', 'output');
            await this.delay(800);
            
            this.print('✅ New API key generated:', 'success');
            this.print('Key: sk_live_' + this.generateRandomKey(), 'output');
            this.print('ID: key_new_' + Date.now().toString().substr(-8), 'output');
            this.print('Name: CLI Generated Key', 'output');
            this.print('Expires: Never', 'output');
            
            this.print('\n⚠️  IMPORTANT: Copy this key now!', 'error');
            this.print('You will not be able to see it again.', 'output');
        } else {
            this.print('🔑 Keys command usage:', 'output');
            this.print('   keys --list          List all API keys', 'output');
            this.print('   keys --generate      Generate new API key', 'output');
            this.print('   keys --revoke <id>   Revoke API key', 'output');
            this.print('   keys --info <id>     Show key details', 'output');
        }
    }
    
    async simulateConfig(args) {
        if (args.includes('--list')) {
            this.print('⚙️  CLI Configuration:', 'output');
            this.print('', 'output');
            this.print('api_url: https://api.mgzon.com/v1', 'output');
            this.print('default_environment: production', 'output');
            this.print('theme: dark', 'output');
            this.print('editor: vscode', 'output');
            this.print('auto_update: true', 'output');
            this.print('telemetry: false', 'output');
            this.print('timeout: 30000', 'output');
            this.print('', 'output');
            this.print('Project Configuration (.mgzon.json):', 'output');
            this.print('project_id: proj_' + this.generateRandomKey(), 'output');
            this.print('name: MGZON CLI Preview', 'output');
            this.print('version: 2.0.8', 'output');
        } else {
            this.print('⚙️  Config command usage:', 'output');
            this.print('   config --list        Show all configurations', 'output');
            this.print('   config --get <key>   Get configuration value', 'output');
            this.print('   config --set key=value Set configuration', 'output');
            this.print('   config --reset       Reset to defaults', 'output');
        }
    }
    
    async simulateServe(args) {
        const hasPort = args.find(arg => arg.startsWith('--port='));
        const port = hasPort ? hasPort.split('=')[1] : '3000';
        
        this.print(`🚀 Starting development server on port ${port}...`, 'output');
        await this.delay(500);
        
        this.print('✅ Compiled successfully!', 'success');
        this.print('✅ Server is running', 'success');
        this.print('✅ WebSocket connected', 'success');
        this.print('✅ File watcher started', 'success');
        
        this.print('\n🌐 URLs:', 'output');
        this.print(`   Local:    http://localhost:${port}`, 'output');
        this.print('   Network:  http://192.168.1.100:' + port, 'output');
        this.print('   WebSocket: ws://localhost:' + port + '/ws', 'output');
        
        this.print('\n📊 Mode: development', 'output');
        this.print('🔄 Hot Reload: enabled', 'output');
        this.print('⚡ TypeScript: enabled', 'output');
        this.print('🔍 ESLint: enabled', 'output');
        
        this.print('\n📝 Press Ctrl+C to stop the server', 'output');
    }
    
    async simulateBuild(args) {
        this.print('🔨 Building for production...', 'output');
        await this.delay(800);
        
        this.print('✅ Build successful! 🎉', 'success');
        
        this.print('\n📊 Build Details:', 'output');
        this.print('   Output: dist/', 'output');
        this.print('   Size: 2.4 MB', 'output');
        this.print('   Chunks: 8', 'output');
        this.print('   Assets: 24', 'output');
        this.print('   Time: 4.2s', 'output');
        
        this.print('\n📦 Bundle Analysis:', 'output');
        this.print('   main.js: 1.2 MB', 'output');
        this.print('   vendor.js: 800 KB', 'output');
        this.print('   styles.css: 150 KB', 'output');
        this.print('   assets: 250 KB', 'output');
    }
    
    clearTerminal() {
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
            this.printWelcome();
        }
    }
    
    copyTerminal() {
        const text = this.outputElement.innerText;
        
        navigator.clipboard.writeText(text)
            .then(() => {
                const originalText = this.copyButton.innerHTML;
                this.copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                this.copyButton.classList.add('success');
                
                setTimeout(() => {
                    this.copyButton.innerHTML = originalText;
                    this.copyButton.classList.remove('success');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                this.print('Failed to copy terminal content', 'error');
            });
    }
    
    handleKeyDown(e) {
        switch(e.key) {
            case 'Enter':
                this.executeCommand();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory(1);
                break;
            case 'Tab':
                e.preventDefault();
                this.autoComplete();
                break;
        }
    }
    
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        this.historyIndex += direction;
        
        if (this.historyIndex < 0) {
            this.historyIndex = 0;
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length;
            this.inputElement.value = '';
            return;
        }
        
        this.inputElement.value = this.commandHistory[this.historyIndex];
        this.inputElement.setSelectionRange(
            this.inputElement.value.length,
            this.inputElement.value.length
        );
    }
    
    autoComplete() {
        const commands = [
            'help', 'version', 'login', 'whoami', 'init', 'deploy',
            'apps', 'keys', 'config', 'serve', 'build', 'clear',
            'ls', 'pwd', 'echo'
        ];
        
        const input = this.inputElement.value.toLowerCase();
        
        const matches = commands.filter(cmd => cmd.startsWith(input));
        if (matches.length === 1) {
            this.inputElement.value = matches[0];
        } else if (matches.length > 1) {
            this.print(`Suggestions: ${matches.join(', ')}`, 'output');
        }
    }
    
    print(text, type = 'output') {
        if (!this.outputElement) return;
        
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        
        // Format based on type
        switch(type) {
            case 'prompt':
                line.innerHTML = `<span class="prompt">${text}</span>`;
                break;
            case 'command':
                const [prompt, cmd] = text.split(' $ ');
                line.innerHTML = `<span class="prompt">${prompt} $</span> <span class="command">${cmd}</span>`;
                break;
            case 'error':
                line.innerHTML = `<span class="error">${text}</span>`;
                break;
            case 'success':
                line.innerHTML = `<span class="success">${text}</span>`;
                break;
            default:
                line.innerHTML = `<span class="output">${text}</span>`;
        }
        
        this.outputElement.appendChild(line);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    generateRandomKey() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
}