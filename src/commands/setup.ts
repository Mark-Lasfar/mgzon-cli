// /workspaces/mgzon-cli/src/commands/setup.ts
import chalk from 'chalk';
import { URL } from 'url';
import { getConfig } from '../utils/config';

export async function setupCommand() {
  console.log(chalk.blue(
    `
  __  __    ____   _____   ___    _   _      ____   _       ___ 
 |  \\/  |  / ___| |__  /  / _ \\  | \\ | |    / ___| | |     |_ _|
 | |\\/| | | |  _    / /  | | | | |  \\| |   | |     | |      | | 
 | |  | | | |_| |  / /_  | |_| | | |\\  |   | |___  | |___   | | 
 |_|  |_|  \\____| /____|  \\___/  |_| \\_|    \\____| |_____| |___|
                                                                
`
  ));
  
  console.log(chalk.cyan('Welcome to MGZON CLI Setup!'));
  console.log(chalk.gray('This wizard will help you configure the CLI for first use.\n'));
  
  // ⭐⭐ إصلاح: لا نطلب authentication في setup
  const config = await getConfig();
  
  console.log(chalk.cyan('Current configuration:'));
  console.log(chalk.gray(`  API URL: ${config.apiUrl || 'Not set'}`));
  console.log(chalk.gray(`  Authenticated: ${config.apiKey ? 'Yes' : 'No'}`));
  
  const { default: inquirer } = await import('inquirer');
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Configure API URL', value: 'config' },
        { name: 'Login with API key', value: 'login' },
        { name: 'Generate new API key', value: 'generate' },
        { name: 'View current config', value: 'view' },
        { name: 'Exit', value: 'exit' }
      ]
    }
  ]);
  
  switch (answers.action) {
    case 'config':
      await configureApiUrl();
      break;
    case 'login':
      await runLogin();
      break;
    case 'generate':
      console.log(chalk.yellow('\n⚠️  To generate API keys, please visit:'));
      console.log(chalk.cyan('   https://mgzon.com/developers/keys'));
      console.log(chalk.gray('\n   Or run: mz keys --generate (after login)'));
      break;
    case 'view':
      console.log(chalk.cyan('\n📋 Current Configuration:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.cyan(`API URL: ${config.apiUrl || 'Not set'}`));
      console.log(chalk.cyan(`Authenticated: ${config.apiKey ? '✅ Yes' : '❌ No'}`));
      if (config.apiKey) {
        console.log(chalk.cyan(`API Key: ${config.apiKey.substring(0, 8)}...`));
      }
      console.log(chalk.cyan(`User: ${config.name || 'Not logged in'}`));
      console.log(chalk.cyan(`Email: ${config.email || 'Not set'}`));
      console.log(chalk.gray('─'.repeat(40)));
      break;
    case 'exit':
      console.log(chalk.gray('\nGoodbye! 👋'));
      return;
  }
}

async function configureApiUrl() {
  const { default: inquirer } = await import('inquirer');
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'connectionType',
      message: 'How do you want to connect to MGZON?',
      choices: [
        { name: 'Local development (localhost:3000)', value: 'localhost' },
        { name: 'Ngrok tunnel (remote access)', value: 'ngrok' },
        { name: 'Custom URL', value: 'custom' }
      ]
    },
    {
      type: 'input',
      name: 'customUrl',
      message: 'Enter your custom API URL:',
      when: (answers) => answers.connectionType === 'custom',
      validate: (input: string) => {
        if (!input) return 'URL is required';
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'input',
      name: 'ngrokUrl',
      message: 'Enter your ngrok URL (e.g., https://abc123.ngrok.io):',
      when: (answers) => answers.connectionType === 'ngrok',
      validate: (input: string) => {
        if (!input) return 'URL is required';
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    }
  ]);
  
  let apiUrl: string;
  
  switch (answers.connectionType) {
    case 'localhost':
      apiUrl = 'http://localhost:3000/api/v1';
      console.log(chalk.yellow('\n⚠️  Note: Make sure your MGZON server is running locally'));
      console.log(chalk.cyan('   cd /path/to/mgzon-server'));
      console.log(chalk.cyan('   npm run dev'));
      break;
    case 'ngrok':
      apiUrl = `${answers.ngrokUrl}/api/v1`;
      console.log(chalk.yellow('\n⚠️  Note: You need to run ngrok on your server:'));
      console.log(chalk.cyan('   ngrok http 3000'));
      break;
    case 'custom':
      apiUrl = answers.customUrl;
      break;
    default:
      apiUrl = 'http://localhost:3000/api/v1';
  }
  
  const { saveConfig } = await import('../utils/config');
  await saveConfig({ apiUrl });
  
  console.log(chalk.green('\n✅ API URL configured!'));
  console.log(chalk.cyan(`   URL: ${apiUrl}`));
  console.log(chalk.cyan('\n   Next: mz login'));
}

async function runLogin() {
  const { loginCommand } = await import('./login');
  await loginCommand({});
}