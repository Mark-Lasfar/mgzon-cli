import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { loginCommand as apiLogin } from '../utils/config';

export async function loginCommand(options: any) {
  const spinner = ora('Logging in...').start();

  try {
    let apiKey = options.apiKey;

    // If API key not provided, ask for it
    if (!apiKey) {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter your MGZON API Key:',
          mask: '*',
          validate: (input: string) => {
            if (!input || input.trim().length < 10) {
              return 'API key must be at least 10 characters';
            }
            return true;
          }
        }
      ]);
      apiKey = answers.apiKey;
    }

    if (!apiKey || apiKey.trim().length < 10) {
      spinner.fail();
      throw new Error('Invalid API key format. Key must be at least 10 characters.');
    }

    // Validate and save
    const userData = await apiLogin(apiKey);
    
    spinner.succeed(chalk.green('✅ Login successful!'));
    
    console.log(chalk.cyan('\n' + '─'.repeat(50)));
    console.log(chalk.bold('📋 Account Information:'));
    console.log(chalk.cyan(`  👤 Name: ${userData.name || 'N/A'}`));
    console.log(chalk.cyan(`  📧 Email: ${userData.email}`));
    console.log(chalk.cyan(`  🎯 Role: ${userData.role || 'Developer'}`));
    
    if (userData.isDeveloper) {
      console.log(chalk.cyan('  🛠️  Type: Developer'));
    } else if (userData.isSeller) {
      console.log(chalk.cyan('  🏪 Type: Seller'));
    } else if (userData.isAdmin) {
      console.log(chalk.cyan('  🔧 Type: Admin'));
    }
    
    console.log(chalk.cyan('\n' + '─'.repeat(50)));
    console.log(chalk.bold('🚀 Next Steps:'));
    console.log(chalk.yellow('  mz init my-app'));
    console.log(chalk.yellow('  mz apps --list'));
    console.log(chalk.yellow('  mz deploy\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Login failed'));
    console.error(chalk.red(`  Error: ${error.message}`));
    
    console.log(chalk.cyan('\n' + '─'.repeat(50)));
    console.log(chalk.bold('🔑 How to get API key:'));
    console.log(chalk.cyan('  1. Go to https://mgzon.com/developers'));
    console.log(chalk.cyan('  2. Login to your account'));
    console.log(chalk.cyan('  3. Go to Settings → API Keys'));
    console.log(chalk.cyan('  4. Generate a new API key\n'));
    
    console.log(chalk.yellow('💡 Tip: Use environment variable:'));
    console.log(chalk.cyan('  export MGZON_API_KEY="your_api_key_here"\n'));
    
    process.exit(1);
  }
}
