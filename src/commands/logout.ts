import chalk from 'chalk';
import ora from 'ora';
import { saveConfig, logout } from '../utils/config';

export async function logoutCommand() {
  const spinner = ora('Logging out...').start();

  try {
    // Attempt server logout
    await logout();
    
    // Clear local config
    await saveConfig({
      apiKey: undefined,
      userId: undefined,
      email: undefined,
      name: undefined,
      role: undefined,
      isDeveloper: undefined,
      isSeller: undefined,
      isAdmin: undefined,
      sessionToken: undefined,
      refreshToken: undefined,
      expiresAt: undefined
    });

    spinner.succeed(chalk.green('✅ Logged out successfully!'));
    
    console.log(chalk.cyan('\n🔑 You have been logged out.'));
    console.log(chalk.yellow('💡 To login again: mz login\n'));
    
  } catch (error: any) {
    spinner.fail(chalk.red('❌ Logout failed'));
    console.error(chalk.red(`  Error: ${error.message}`));
  }
}
