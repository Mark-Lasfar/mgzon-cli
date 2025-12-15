#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { checkForUpdates } from './utils/config';

// Display banner
console.log(
  chalk.blue(
    figlet.textSync('MGZON CLI', { horizontalLayout: 'full' })
  )
);

// Check for updates (async, won't block)
checkForUpdates().catch(() => {});

const program = new Command();

program
  .name('mz')
  .description('MGZON Command Line Interface - Official CLI tool for MGZON Platform')
  .version('1.0.0', '-v, --version')
  .addHelpText('afterAll', `
${chalk.gray('─'.repeat(50))}
${chalk.bold('📊 MGZON CLI Information')}
${chalk.gray('├')} Version: 1.0.0
${chalk.gray('├')} Node.js: ${process.version}
${chalk.gray('├')} Platform: ${process.platform} (${process.arch})
${chalk.gray('├')} Homepage: https://mgzon.com/cli
${chalk.gray('└')} Issues: https://github.com/Mark-Lasfar/mgzon-cli/issues
${chalk.gray('─'.repeat(50))}
`)
  .hook('preAction', async (thisCommand, actionCommand) => {
    const commandName = actionCommand.name();
    
    // Skip auth check if no command name (shouldn't happen but just in case)
    if (!commandName) {
      return;
    }
    
    // Skip auth check for these commands
    const skipAuthCommands = ['login', 'logout', 'whoami', 'help', '--help', '-h', '--version', '-v', 'docs', 'support', 'update'];
    
    if (skipAuthCommands.includes(commandName)) {
      return;
    }
    
    // Check authentication
    try {
      const { requireAuth } = await import('./middleware/auth');
      await requireAuth();
    } catch (error: any) {
      console.error(chalk.red('\n' + '─'.repeat(50)));
      console.error(chalk.red('❌ Authentication required'));
      console.error(chalk.red(`   ${error.message || 'Please login first'}`));
      console.error(chalk.red('─'.repeat(50)));
      console.error(chalk.cyan('\n💡 Run: mz login'));
      console.error(chalk.cyan('   Or set MGZON_API_KEY environment variable\n'));
      process.exit(1);
    }
  });

// ===== أوامر المصادقة =====
program
  .command('login')
  .description('Login to MGZON with API key')
  .option('-k, --api-key <key>', 'API key')
  .action(async (options) => {
    const { loginCommand } = await import('./commands/login');
    await loginCommand(options);
  });

program
  .command('logout')
  .description('Logout from MGZON')
  .action(async () => {
    try {
      const { logout } = await import('./utils/config');
      await logout();
      console.log(chalk.green('✅ Logged out successfully!'));
    } catch (error: any) {
      console.error(chalk.red('❌ Logout failed:'), error.message);
    }
  });

program
  .command('whoami')
  .description('Show current logged-in user')
  .action(async () => {
    const { getUserInfo } = await import('./utils/config');
    const userInfo = await getUserInfo();
    
    if (userInfo.email) {
      console.log(chalk.green('\n' + '─'.repeat(50)));
      console.log(chalk.green('✅ You are logged in:'));
      console.log(chalk.green('─'.repeat(50)));
      console.log(chalk.cyan(`   👤 Name: ${userInfo.name || 'Not available'}`));
      console.log(chalk.cyan(`   📧 Email: ${userInfo.email}`));
      console.log(chalk.cyan(`   🆔 User ID: ${userInfo.userId || 'Not available'}`));
      console.log(chalk.cyan(`   🎯 Role: ${userInfo.role || 'Developer'}`));
      
      if (userInfo.isDeveloper) {
        console.log(chalk.cyan('   🛠️  Type: Developer'));
      }
      if (userInfo.isSeller) {
        console.log(chalk.cyan('   🏪 Type: Seller'));
      }
      if (userInfo.isAdmin) {
        console.log(chalk.cyan('   🔧 Type: Admin'));
      }
      console.log(chalk.green('─'.repeat(50) + '\n'));
    } else {
      console.log(chalk.yellow('\n' + '─'.repeat(50)));
      console.log(chalk.yellow('⚠️  You are not logged in.'));
      console.log(chalk.yellow('─'.repeat(50)));
      console.log(chalk.cyan('   Run: mz login'));
      console.log(chalk.cyan('   Or set MGZON_API_KEY environment variable\n'));
    }
  });

// ===== أوامر التطبيقات =====
program
  .command('init [project-name]')
  .description('Initialize a new MGZON app')
  .option('-t, --template <template>', 'Project template (react, nextjs, vue, static, ecommerce)', 'nextjs')
  .option('--with-auth', 'Include authentication')
  .option('--with-database', 'Include database setup')
  .option('--typescript', 'Use TypeScript')
  .option('--no-install', 'Skip package installation')
  .action(async (projectName, options) => {
    const { initCommand } = await import('./commands/init');
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
    const { serveCommand } = await import('./commands/serve');
    await serveCommand(options);
  });

program
  .command('build')
  .description('Build app for production')
  .option('--analyze', 'Analyze bundle size')
  .option('--minify', 'Minify output', true)
  .option('--sourcemap', 'Generate source maps')
  .action(async (options) => {
    const { buildCommand } = await import('./commands/build');
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
    const { deployCommand } = await import('./commands/deploy');
    await deployCommand(options);
  });

program
  .command('generate <type>')
  .description('Generate code (model, component, page, api)')
  .option('-n, --name <name>', 'Component/model name')
  .option('-f, --fields <fields>', 'Model fields (comma separated: name:string,age:number)')
  .option('-p, --path <path>', 'Output path')
  .action(async (type, options) => {
    const { generateCommand } = await import('./commands/generate');
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
    const { webhookCommand } = await import('./commands/webhook');
    await webhookCommand(options);
  });

// ===== أوامر الإدارة =====
program
  .command('config')
  .description('Manage CLI configuration')
  .option('-l, --list', 'List all configurations')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .option('--reset', 'Reset to default configuration')
  .action(async (options) => {
    const { configCommand } = await import('./commands/config');
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
    const { keysCommand } = await import('./commands/keys');
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
    const { appsCommand } = await import('./commands/apps');
    await appsCommand(options);
  });

// ===== أوامر التخزين =====
program
  .command('storage')
  .description('File storage operations')
  .option('-l, --list', 'List files')
  .option('-u, --upload <file>', 'Upload file')
  .option('-d, --delete <id>', 'Delete file')
  .option('--download <id>', 'Download file')
  .action(async (options) => {
    const { storageCommand } = await import('./commands/storage');
    await storageCommand(options);
  });

// ===== أوامر التحديث =====
program
  .command('update')
  .description('Update CLI to latest version')
  .action(async () => {
    console.log(chalk.cyan('\n' + '─'.repeat(50)));
    console.log(chalk.cyan('🔄 Updating MGZON CLI...'));
    console.log(chalk.cyan('─'.repeat(50)));
    
    const { execSync } = await import('child_process');
    try {
      execSync('npm install -g @mgzon/cli@latest', { stdio: 'inherit' });
      console.log(chalk.green('\n✅ Updated successfully!'));
      console.log(chalk.cyan('   Run: mz --version to verify\n'));
    } catch (error: any) {
      console.error(chalk.red('\n❌ Update failed'));
      console.error(chalk.red(`   ${error.message}`));
      console.error(chalk.cyan('\n💡 Try: sudo npm install -g @mgzon/cli@latest\n'));
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
    const { debugCommand } = await import('./commands/debug');
    await debugCommand(options);
  });

// ===== أوامر المساعدة =====
program
  .command('docs')
  .description('Open documentation in browser')
  .option('--offline', 'Open offline docs')
  .action(async (options) => {
    try {
      const open = (await import('open')).default;
      const url = options.offline 
        ? 'https://docs.mgzon.com/cli/offline'
        : 'https://docs.mgzon.com/cli';
      
      await open(url);
      console.log(chalk.green(`\n✅ Opening documentation at ${url}\n`));
    } catch (error: any) {
      console.error(chalk.red('\n❌ Failed to open documentation'));
      console.error(chalk.cyan(`   Manual URL: https://docs.mgzon.com/cli\n`));
    }
  });

program
  .command('support')
  .description('Get support')
  .action(async () => {
    console.log(chalk.cyan('\n' + '═'.repeat(50)));
    console.log(chalk.bold.cyan('📞 MGZON Support'));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.cyan('🌐 Website: ') + chalk.white('https://mgzon.com/support'));
    console.log(chalk.cyan('📧 Email:   ') + chalk.white('support@mgzon.com'));
    console.log(chalk.cyan('💬 Discord: ') + chalk.white('https://discord.gg/mgzon'));
    console.log(chalk.cyan('🐙 GitHub:  ') + chalk.white('https://github.com/mgzon/mgzon-cli/issues'));
    console.log(chalk.cyan('═'.repeat(50) + '\n'));
  });

// Help text for common issues
program.addHelpText('after', `

${chalk.bold('🚀 Examples:')}
  ${chalk.cyan('$ mz login')}                              # Login to MGZON
  ${chalk.cyan('$ mz init my-app --template=nextjs')}     # Create new app
  ${chalk.cyan('$ mz deploy --env=production')}           # Deploy app
  ${chalk.cyan('$ mz keys --generate')}                   # Generate API key
  ${chalk.cyan('$ mz webhook --simulate order.created')}  # Test webhook
  ${chalk.cyan('$ mz config --set theme=dark')}           # Set CLI theme

${chalk.bold('📖 Quick Start:')}
  1. ${chalk.cyan('mz login')}                            # Authenticate
  2. ${chalk.cyan('mz init my-project')}                  # Create project
  3. ${chalk.cyan('cd my-project && npm install')}        # Install deps
  4. ${chalk.cyan('mz serve')}                            # Run locally
  5. ${chalk.cyan('mz deploy')}                           # Deploy to MGZON

${chalk.bold('❓ Need Help?')}
  ${chalk.cyan('mz docs')}                                # Open documentation
  ${chalk.cyan('mz support')}                             # Show support options
  ${chalk.cyan('https://docs.mgzon.com/cli')}             # Full documentation
  ${chalk.cyan('support@mgzon.com')}                      # Support Email
`);

// Handle unknown commands
program.on('command:*', () => {
  console.log(chalk.red('\n' + '─'.repeat(50)));
  console.log(chalk.red(`❌ Unknown command: ${program.args.join(' ')}`));
  console.log(chalk.red('─'.repeat(50)));
  console.log(chalk.cyan('\n💡 Run mz --help for available commands'));
  console.log(chalk.cyan('💡 Or mz <command> --help for command help\n'));
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n' + '─'.repeat(50)));
  console.error(chalk.bold.red('❌ Unhandled Error:'));
  console.error(chalk.red(error instanceof Error ? error.stack : String(error)));
  console.error(chalk.red('─'.repeat(50) + '\n'));
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n' + '─'.repeat(50)));
  console.error(chalk.bold.red('❌ Fatal Error:'));
  console.error(chalk.red(error.stack || error.message));
  console.error(chalk.red('─'.repeat(50) + '\n'));
  process.exit(1);
});

// Parse arguments
try {
  program.parse();
} catch (error: any) {
  console.error(chalk.red('\n❌ Error parsing command:'));
  console.error(chalk.red(error.message));
  process.exit(1);
}
