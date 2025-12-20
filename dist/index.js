#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const config_1 = require("./utils/config");
console.log(chalk_1.default.blue(figlet_1.default.textSync('MGZON CLI', { horizontalLayout: 'full' })));
(0, config_1.checkForUpdates)().catch(() => { });
const program = new commander_1.Command();
program
    .name('mz')
    .description('MGZON Command Line Interface - Official CLI tool for MGZON Platform')
    .version('1.0.0', '-v, --version')
    .addHelpText('afterAll', `
${chalk_1.default.gray('─'.repeat(50))}
${chalk_1.default.bold('📊 MGZON CLI Information')}
${chalk_1.default.gray('├')} Version: 1.0.0
${chalk_1.default.gray('├')} Node.js: ${process.version}
${chalk_1.default.gray('├')} Platform: ${process.platform} (${process.arch})
${chalk_1.default.gray('├')} Homepage: https://mgzon.com/cli
${chalk_1.default.gray('└')} Issues: https://github.com/Mark-Lasfar/mgzon-cli/issues
${chalk_1.default.gray('─'.repeat(50))}
`)
    .hook('preAction', async (thisCommand, actionCommand) => {
    const commandName = actionCommand.name();
    if (!commandName) {
        return;
    }
    const skipAuthCommands = ['login', 'logout', 'whoami', 'help', '--help', '-h', '--version', '-v', 'docs', 'support', 'update'];
    if (skipAuthCommands.includes(commandName)) {
        return;
    }
    try {
        const { requireAuth } = await Promise.resolve().then(() => __importStar(require('./middleware/auth')));
        await requireAuth();
    }
    catch (error) {
        console.error(chalk_1.default.red('\n' + '─'.repeat(50)));
        console.error(chalk_1.default.red('❌ Authentication required'));
        console.error(chalk_1.default.red(`   ${error.message || 'Please login first'}`));
        console.error(chalk_1.default.red('─'.repeat(50)));
        console.error(chalk_1.default.cyan('\n💡 Run: mz login'));
        console.error(chalk_1.default.cyan('   Or set MGZON_API_KEY environment variable\n'));
        process.exit(1);
    }
});
program
    .command('login')
    .description('Login to MGZON with API key')
    .option('-k, --api-key <key>', 'API key')
    .action(async (options) => {
    const { loginCommand } = await Promise.resolve().then(() => __importStar(require('./commands/login')));
    await loginCommand(options);
});
program
    .command('logout')
    .description('Logout from MGZON')
    .action(async () => {
    try {
        const { logout } = await Promise.resolve().then(() => __importStar(require('./utils/config')));
        await logout();
        console.log(chalk_1.default.green('✅ Logged out successfully!'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Logout failed:'), error.message);
    }
});
program
    .command('setup')
    .description('Setup wizard for first-time configuration')
    .action(async () => {
    const { setupCommand } = await Promise.resolve().then(() => __importStar(require('./commands/setup')));
    await setupCommand();
});
program
    .command('whoami')
    .description('Show current logged-in user')
    .action(async () => {
    const { getUserInfo } = await Promise.resolve().then(() => __importStar(require('./utils/config')));
    const userInfo = await getUserInfo();
    if (userInfo.email) {
        console.log(chalk_1.default.green('\n' + '─'.repeat(50)));
        console.log(chalk_1.default.green('✅ You are logged in:'));
        console.log(chalk_1.default.green('─'.repeat(50)));
        console.log(chalk_1.default.cyan(`   👤 Name: ${userInfo.name || 'Not available'}`));
        console.log(chalk_1.default.cyan(`   📧 Email: ${userInfo.email}`));
        console.log(chalk_1.default.cyan(`   🆔 User ID: ${userInfo.userId || 'Not available'}`));
        console.log(chalk_1.default.cyan(`   🎯 Role: ${userInfo.role || 'Developer'}`));
        if (userInfo.isDeveloper) {
            console.log(chalk_1.default.cyan('   🛠️  Type: Developer'));
        }
        if (userInfo.isSeller) {
            console.log(chalk_1.default.cyan('   🏪 Type: Seller'));
        }
        if (userInfo.isAdmin) {
            console.log(chalk_1.default.cyan('   🔧 Type: Admin'));
        }
        console.log(chalk_1.default.green('─'.repeat(50) + '\n'));
    }
    else {
        console.log(chalk_1.default.yellow('\n' + '─'.repeat(50)));
        console.log(chalk_1.default.yellow('⚠️  You are not logged in.'));
        console.log(chalk_1.default.yellow('─'.repeat(50)));
        console.log(chalk_1.default.cyan('   Run: mz login'));
        console.log(chalk_1.default.cyan('   Or set MGZON_API_KEY environment variable\n'));
    }
});
program
    .command('init [project-name]')
    .description('Initialize a new MGZON app')
    .option('-t, --template <template>', 'Project template (react, nextjs, vue, static, ecommerce)', 'nextjs')
    .option('--with-auth', 'Include authentication')
    .option('--with-database', 'Include database setup')
    .option('--typescript', 'Use TypeScript')
    .option('--no-install', 'Skip package installation')
    .action(async (projectName, options) => {
    const { initCommand } = await Promise.resolve().then(() => __importStar(require('./commands/init')));
    await initCommand(projectName, options);
});
program
    .command('serve')
    .description('Start development server')
    .option('-p, --port <port>', 'Port number', '3000')
    .option('--host <host>', 'Host address', 'localhost')
    .option('--webhook-url <url>', 'Webhook URL for local testing')
    .option('--watch', 'Watch for file changes', true)
    .option('--no-watch', 'Disable file watching')
    .action(async (options) => {
    const { serveCommand } = await Promise.resolve().then(() => __importStar(require('./commands/serve')));
    await serveCommand(options);
});
program
    .command('build')
    .description('Build app for production')
    .option('--analyze', 'Analyze bundle size')
    .option('--minify', 'Minify output', true)
    .option('--sourcemap', 'Generate source maps')
    .action(async (options) => {
    const { buildCommand } = await Promise.resolve().then(() => __importStar(require('./commands/build')));
    await buildCommand(options);
});
program
    .command('deploy')
    .description('Deploy app to MGZON marketplace')
    .option('-e, --env <environment>', 'Environment (staging, production)', 'staging')
    .option('--auto-approve', 'Skip confirmation prompts')
    .option('--build', 'Build before deploying', true)
    .option('--no-build', 'Skip building')
    .option('--app-id <id>', 'App ID (required if not in .mgzon.json)')
    .action(async (options) => {
    const { deployCommand } = await Promise.resolve().then(() => __importStar(require('./commands/deploy')));
    await deployCommand(options);
});
program
    .command('generate <type>')
    .description('Generate code (model, component, page, api)')
    .option('-n, --name <name>', 'Component/model name')
    .option('-f, --fields <fields>', 'Model fields (comma separated: name:string,age:number)')
    .option('-p, --path <path>', 'Output path')
    .action(async (type, options) => {
    const { generateCommand } = await Promise.resolve().then(() => __importStar(require('./commands/generate')));
    await generateCommand(type, options);
});
program
    .command('webhook')
    .description('Manage webhooks')
    .option('-l, --list', 'List webhooks')
    .option('-c, --create', 'Create webhook')
    .option('-d, --delete <id>', 'Delete webhook')
    .option('-s, --simulate <event>', 'Simulate webhook event')
    .option('-u, --url <url>', 'Webhook URL')
    .option('-e, --events <events>', 'Events to listen to (comma separated)')
    .action(async (options) => {
    const { webhookCommand } = await Promise.resolve().then(() => __importStar(require('./commands/webhook')));
    await webhookCommand(options);
});
program
    .command('config')
    .description('Manage CLI configuration')
    .option('-l, --list', 'List all configurations')
    .option('-s, --set <key=value>', 'Set configuration value')
    .option('-g, --get <key>', 'Get configuration value')
    .option('--reset', 'Reset to default configuration')
    .action(async (options) => {
    const { configCommand } = await Promise.resolve().then(() => __importStar(require('./commands/config')));
    await configCommand(options);
});
program
    .command('keys')
    .description('Manage API keys')
    .option('-l, --list', 'List API keys')
    .option('-g, --generate', 'Generate new API key')
    .option('-r, --revoke <id>', 'Revoke API key')
    .option('-n, --name <name>', 'Key name for generation')
    .option('--expires <days>', 'Expiration in days', '365')
    .action(async (options) => {
    const { keysCommand } = await Promise.resolve().then(() => __importStar(require('./commands/keys')));
    await keysCommand(options);
});
program
    .command('apps')
    .description('Manage apps')
    .option('-l, --list', 'List your apps')
    .option('-c, --create <name>', 'Create new app')
    .option('-i, --info <id>', 'Show app details')
    .option('-d, --delete <id>', 'Delete app')
    .option('--domains <id>', 'List app domains')
    .option('--logs <id>', 'View app logs')
    .action(async (options) => {
    const { appsCommand } = await Promise.resolve().then(() => __importStar(require('./commands/apps')));
    await appsCommand(options);
});
program
    .command('db')
    .description('Database management operations')
    .option('-m, --migrate', 'Run database migrations')
    .option('-s, --seed', 'Seed database with sample data')
    .option('--stats', 'Show database statistics')
    .option('--backup', 'Create database backup')
    .option('--restore <file>', 'Restore database from backup')
    .action(async (options) => {
    const { dbCommand } = await Promise.resolve().then(() => __importStar(require('./commands/db')));
    await dbCommand(options);
});
program
    .command('storage')
    .description('File storage operations')
    .option('-l, --list', 'List files')
    .option('-u, --upload <file>', 'Upload file')
    .option('-d, --delete <id>', 'Delete file')
    .option('--download <id>', 'Download file')
    .action(async (options) => {
    const { storageCommand } = await Promise.resolve().then(() => __importStar(require('./commands/storage')));
    await storageCommand(options);
});
program
    .command('update')
    .description('Update CLI to latest version')
    .action(async () => {
    console.log(chalk_1.default.cyan('\n' + '─'.repeat(50)));
    console.log(chalk_1.default.cyan('🔄 Updating MGZON CLI...'));
    console.log(chalk_1.default.cyan('─'.repeat(50)));
    const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
    try {
        execSync('npm install -g @mgzon/cli@latest', { stdio: 'inherit' });
        console.log(chalk_1.default.green('\n✅ Updated successfully!'));
        console.log(chalk_1.default.cyan('   Run: mz --version to verify\n'));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Update failed'));
        console.error(chalk_1.default.red(`   ${error.message}`));
        console.error(chalk_1.default.cyan('\n💡 Try: sudo npm install -g @mgzon/cli@latest\n'));
    }
});
program
    .command('debug')
    .description('Debug tools')
    .option('--network', 'Network debugging')
    .option('--performance', 'Performance monitoring')
    .option('--memory', 'Memory usage')
    .option('--trace', 'Trace execution')
    .action(async (options) => {
    const { debugCommand } = await Promise.resolve().then(() => __importStar(require('./commands/debug')));
    await debugCommand(options);
});
program
    .command('docs')
    .description('Open documentation in browser')
    .option('--offline', 'Open offline docs')
    .action(async (options) => {
    try {
        const open = (await Promise.resolve().then(() => __importStar(require('open')))).default;
        const url = options.offline
            ? 'https://docs.mgzon.com/cli/offline'
            : 'https://docs.mgzon.com/cli';
        await open(url);
        console.log(chalk_1.default.green(`\n✅ Opening documentation at ${url}\n`));
    }
    catch {
        console.error(chalk_1.default.red('\n❌ Failed to open documentation'));
        console.error(chalk_1.default.cyan(`   Manual URL: https://docs.mgzon.com/cli\n`));
    }
});
program
    .command('support')
    .description('Get support')
    .action(async () => {
    console.log(chalk_1.default.cyan('\n' + '═'.repeat(50)));
    console.log(chalk_1.default.bold.cyan('📞 MGZON Support'));
    console.log(chalk_1.default.cyan('═'.repeat(50)));
    console.log(chalk_1.default.cyan('🌐 Website: ') + chalk_1.default.white('https://mgzon.com/support'));
    console.log(chalk_1.default.cyan('📧 Email:   ') + chalk_1.default.white('support@mgzon.com'));
    console.log(chalk_1.default.cyan('💬 Discord: ') + chalk_1.default.white('https://discord.gg/mgzon'));
    console.log(chalk_1.default.cyan('🐙 GitHub:  ') + chalk_1.default.white('https://github.com/mgzon/mgzon-cli/issues'));
    console.log(chalk_1.default.cyan('═'.repeat(50) + '\n'));
});
program.addHelpText('after', `

${chalk_1.default.bold('🚀 Examples:')}
  ${chalk_1.default.cyan('$ mz login')}                              # Login to MGZON
  ${chalk_1.default.cyan('$ mz init my-app --template=nextjs')}     # Create new app
  ${chalk_1.default.cyan('$ mz deploy --env=production')}           # Deploy app
  ${chalk_1.default.cyan('$ mz keys --generate')}                   # Generate API key
  ${chalk_1.default.cyan('$ mz webhook --simulate order.created')}  # Test webhook
  ${chalk_1.default.cyan('$ mz config --set theme=dark')}           # Set CLI theme

${chalk_1.default.bold('📖 Quick Start:')}
  1. ${chalk_1.default.cyan('mz login')}                            # Authenticate
  2. ${chalk_1.default.cyan('mz init my-project')}                  # Create project
  3. ${chalk_1.default.cyan('cd my-project && npm install')}        # Install deps
  4. ${chalk_1.default.cyan('mz serve')}                            # Run locally
  5. ${chalk_1.default.cyan('mz deploy')}                           # Deploy to MGZON

${chalk_1.default.bold('❓ Need Help?')}
  ${chalk_1.default.cyan('mz docs')}                                # Open documentation
  ${chalk_1.default.cyan('mz support')}                             # Show support options
  ${chalk_1.default.cyan('https://docs.mgzon.com/cli')}             # Full documentation
  ${chalk_1.default.cyan('support@mgzon.com')}                      # Support Email
`);
program.on('command:*', () => {
    console.log(chalk_1.default.red('\n' + '─'.repeat(50)));
    console.log(chalk_1.default.red(`❌ Unknown command: ${program.args.join(' ')}`));
    console.log(chalk_1.default.red('─'.repeat(50)));
    console.log(chalk_1.default.cyan('\n💡 Run mz --help for available commands'));
    console.log(chalk_1.default.cyan('💡 Or mz <command> --help for command help\n'));
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    console.error(chalk_1.default.red('\n' + '─'.repeat(50)));
    console.error(chalk_1.default.bold.red('❌ Unhandled Error:'));
    console.error(chalk_1.default.red(error instanceof Error ? error.stack : String(error)));
    console.error(chalk_1.default.red('─'.repeat(50) + '\n'));
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error(chalk_1.default.red('\n' + '─'.repeat(50)));
    console.error(chalk_1.default.bold.red('❌ Fatal Error:'));
    console.error(chalk_1.default.red(error.stack || error.message));
    console.error(chalk_1.default.red('─'.repeat(50) + '\n'));
    process.exit(1);
});
try {
    program.parse();
}
catch (error) {
    console.error(chalk_1.default.red('\n❌ Error parsing command:'));
    console.error(chalk_1.default.red(error.message));
    process.exit(1);
}
