// /workspaces/mgzon-cli/src/commands/logout.ts
import chalk from 'chalk';
import ora from 'ora';
import { logout as apiLogout, getUserInfo, getApiUrl } from '../utils/config';

export async function logoutCommand() {
  const spinner = ora('Logging out...').start();

  try {
    // Get user info before logout for better UX
    const userInfo = await getUserInfo();
    const apiUrl = await getApiUrl();
    
    console.log(chalk.gray(`   Debug: Logging out from: ${apiUrl}`));
    
    if (userInfo.email) {
      console.log(chalk.gray(`   User: ${userInfo.email}`));
    }

    // Attempt server logout
    await apiLogout();
    
    spinner.succeed(chalk.green('✅ Logged out successfully!'));
    
    console.log(chalk.cyan('\n' + '─'.repeat(50)));
    console.log(chalk.green('🔒 Logout Successful'));
    console.log(chalk.gray('─'.repeat(50)));
    
    if (userInfo.email) {
      console.log(chalk.cyan(`   User: ${userInfo.email}`));
    }
    if (userInfo.name) {
      console.log(chalk.cyan(`   Name: ${userInfo.name}`));
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.yellow('\n💡 Information:'));
    console.log(chalk.cyan('   ✓ API key cleared from local storage'));
    console.log(chalk.cyan('   ✓ Session tokens removed'));
    console.log(chalk.cyan('   ✓ User data cleared'));
    console.log(chalk.gray('─'.repeat(50)));
    
    console.log(chalk.yellow('\n🚀 Next Steps:'));
    console.log(chalk.cyan('   To login again: mz login'));
    console.log(chalk.cyan('   Or use: mz login --api-key="YOUR_API_KEY"'));
    console.log(chalk.cyan('   Get API keys: https://mgzon.com/developers\n'));
    
  } catch (error: any) {
    spinner.fail(chalk.red('❌ Logout failed'));
    
    console.log(chalk.red('\n' + '─'.repeat(50)));
    console.log(chalk.bold.red('Logout Error'));
    console.log(chalk.red('─'.repeat(50)));
    console.error(chalk.red(`   ${error.message}`));
    
    console.log(chalk.gray('\n' + '─'.repeat(50)));
    console.log(chalk.yellow('🔧 Troubleshooting:'));
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log(chalk.cyan('   1. Check if MGZON API server is running'));
      console.log(chalk.cyan('   2. Verify network connection'));
      console.log(chalk.cyan('   3. Try: mz config --get apiUrl'));
    } else if (error.message.includes('Cannot connect')) {
      console.log(chalk.cyan('   1. Current API URL: ' + (await getApiUrl().catch(() => 'Unknown'))));
      console.log(chalk.cyan('   2. Try: mz config --set apiUrl=http://localhost:3000/api/v1'));
      console.log(chalk.cyan('   3. Then: mz logout'));
    } else {
      console.log(chalk.cyan('   1. Clear local config manually:'));
      console.log(chalk.cyan('      rm ~/.mgzon/config.json'));
      console.log(chalk.cyan('   2. Set environment variable:'));
      console.log(chalk.cyan('      unset MGZON_API_KEY'));
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    
    // Fallback: Try to clear local config even if server logout fails
    try {
      const { saveConfig } = await import('../utils/config');
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
        expiresAt: undefined
      });
      
      console.log(chalk.yellow('\n⚠️  Local config cleared.'));
      console.log(chalk.cyan('   You can now login again.\n'));
    } catch (fallbackError: any) {
      console.error(chalk.red('   Could not clear local config:', fallbackError.message));
    }
  }
}