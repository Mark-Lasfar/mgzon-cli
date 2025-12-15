import chalk from 'chalk';
import ora from 'ora';
import { getConfig, saveConfig } from '../utils/config';

export async function configCommand(options: any) {
  const spinner = ora('Processing...').start();

  try {
    const config = await getConfig();

    if (options.reset) {
      const defaultConfig = {
        apiUrl: 'https://api.mgzon.com/v1',
       defaultEnvironment: 'staging' as const
      };
      await saveConfig(defaultConfig);
      spinner.succeed(chalk.green('✅ Configuration reset to defaults'));
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
    console.log(chalk.gray('─'.repeat(50)));

    for (const [key, value] of Object.entries(config)) {
      const displayValue = key === 'apiKey' && value 
        ? `${(value as string).substring(0, 10)}...` 
        : value || chalk.gray('(not set)');
      
      console.log(`${chalk.cyan(key.padEnd(20))}: ${displayValue}`);
    }

    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.cyan('  mz config --list                  ') + chalk.gray('# List all config'));
    console.log(chalk.cyan('  mz config --set theme=dark        ') + chalk.gray('# Set a config value'));
    console.log(chalk.cyan('  mz config --get apiUrl            ') + chalk.gray('# Get a config value'));
    console.log(chalk.cyan('  mz config --reset                 ') + chalk.gray('# Reset to defaults\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Config command failed'));
    console.error(chalk.red(`  Error: ${error.message}`));
  }
}
