// /workspaces/mgzon-cli/src/commands/config.ts
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, saveConfig } from '../utils/config';

export async function configCommand(options: any) {
  const spinner = ora('Processing...').start();

  try {
    const config = await getConfig();

    if (options.reset) {
      // ✅ تصحيح: localhost بدلاً من api.mgzon.com
      const defaultConfig = {
        apiUrl: 'http://localhost:3000/api/v1',  // ✅ هنا التصحيح!
        defaultEnvironment: 'development' as const
      };
      await saveConfig(defaultConfig);
      spinner.succeed(chalk.green('✅ Configuration reset to defaults'));
      
      console.log(chalk.gray('\n─'.repeat(40)));
      console.log(chalk.cyan('New Configuration:'));
      console.log(chalk.cyan(`  apiUrl: http://localhost:3000/api/v1`));
      console.log(chalk.cyan(`  defaultEnvironment: development`));
      console.log(chalk.gray('─'.repeat(40)));
      
      return;
    }

    if (options.set) {
      const [key, value] = options.set.split('=');
      
      if (!key || !value) {
        throw new Error('Invalid format. Use: --set key=value');
      }

      const validKeys = ['apiUrl', 'defaultEnvironment', 'theme', 'editor'];
      
      if (!validKeys.includes(key)) {
        throw new Error(`Invalid key. Valid keys: ${validKeys.join(', ')}`);
      }

      // ✅ إضافة validation للـ apiUrl
      if (key === 'apiUrl') {
        try {
          const url = new URL(value);
          if (!value.includes('/api/v1')) {
            console.log(chalk.yellow('⚠️  Warning: apiUrl should end with /api/v1'));
            console.log(chalk.cyan('   Example: http://localhost:3000/api/v1'));
          }
        } catch {
          throw new Error('Invalid URL format');
        }
      }

      await saveConfig({ [key]: value });
      spinner.succeed(chalk.green(`✅ Set ${key} = ${value}`));
      return;
    }

    if (options.get) {
      const value = config[options.get as keyof typeof config];
      spinner.stop();
      
      if (value === undefined) {
        console.log(chalk.yellow(`⚠️  ${options.get} is not set`));
      } else {
        console.log(chalk.green(`${options.get} = ${value}`));
      }
      return;
    }

    // Default: list all configurations
    spinner.stop();
    
    console.log(chalk.cyan('\n⚙️  MGZON CLI Configuration\n'));
    console.log(chalk.gray('─'.repeat(60)));

    // ✅ إضافة معلومات debugging
    console.log(chalk.gray('Debug Info:'));
    console.log(chalk.gray(`  Current Directory: ${process.cwd()}`));
    console.log(chalk.gray(`  Config File: ${process.env.HOME}/.mgzon/config.json`));
    console.log(chalk.gray('─'.repeat(60)));

    for (const [key, value] of Object.entries(config)) {
      const displayValue = key === 'apiKey' && value 
        ? `${(value as string).substring(0, 10)}...` 
        : value || chalk.gray('(not set)');
      
      // ✅ إضافة colors
      let valueColor = chalk.white;
      
      if (key === 'apiUrl') {
        if (value?.includes('localhost')) {
          valueColor = chalk.green;
        } else if (value?.includes('api.mgzon.com')) {
          valueColor = chalk.yellow;
        }
      }
      
      console.log(`${chalk.cyan(key.padEnd(20))}: ${valueColor(displayValue)}`);
    }

    console.log(chalk.gray('─'.repeat(60)));
    
    // ✅ إضافة tips
    console.log(chalk.yellow('\n💡 Tips:'));
    console.log(chalk.cyan('  For local development:'));
    console.log(chalk.gray('    mz config --set apiUrl=http://localhost:3000/api/v1'));
    console.log(chalk.cyan('\n  To test API connection:'));
    console.log(chalk.gray('    curl http://localhost:3000/api/v1/health'));
    
    console.log(chalk.gray('\n' + '─'.repeat(60)));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.cyan('  mz config --list                  ') + chalk.gray('# List all config'));
    console.log(chalk.cyan('  mz config --set theme=dark        ') + chalk.gray('# Set a config value'));
    console.log(chalk.cyan('  mz config --get apiUrl            ') + chalk.gray('# Get a config value'));
    console.log(chalk.cyan('  mz config --reset                 ') + chalk.gray('# Reset to defaults\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Config command failed'));
    console.error(chalk.red(`  Error: ${error.message}`));
    
    // ✅ إضافة debugging info
    console.log(chalk.cyan('\n🔧 Debug Information:'));
    console.log(chalk.gray(`  Current dir: ${process.cwd()}`));
    console.log(chalk.gray(`  Node version: ${process.version}`));
    console.log(chalk.gray(`  Platform: ${process.platform}`));
  }
}