import chalk from 'chalk';
import { getConfig, getApiKey, getApiUrl } from '../utils/config';
import axios from 'axios';

export async function whoamiCommand() {
  try {
    const config = await getConfig();
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      console.log(chalk.yellow('\n⚠️  You are not logged in.'));
      console.log(chalk.cyan('   Run: mz login to authenticate\n'));
      return;
    }
    
    console.log(chalk.cyan('\n👤 Your Account Information\n'));
    console.log(chalk.gray('─'.repeat(50)));
    
    if (config.name || config.email) {
      console.log(chalk.green(`Name:  ${config.name || 'Not set'}`));
      console.log(chalk.green(`Email: ${config.email || 'Not set'}`));
      console.log(chalk.green(`Role:  ${config.role || 'Not set'}`));
      console.log(chalk.green(`User ID: ${config.userId ? config.userId.substring(0, 8) + '...' : 'Not set'}`));
      console.log(chalk.gray('─'.repeat(50)));
    }
    
    console.log(chalk.green(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`));
    console.log(chalk.green(`API URL: ${await getApiUrl()}`));
    
    if (config.lastLogin) {
      console.log(chalk.green(`Last login: ${new Date(config.lastLogin).toLocaleString()}`));
    }
    
    console.log(chalk.gray('\n─'.repeat(50)));
    
    // محاولة الحصول على معلومات إضافية من الـ API
    try {
      const apiUrl = await getApiUrl();
      const response = await axios.get(`${apiUrl}/api/v1/auth/verify`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.data.data?.user) {
        const user = response.data.data.user;
        console.log(chalk.cyan('\n📊 Live API Status:'));
        console.log(chalk.green(`  Verified: ✅`));
        console.log(chalk.green(`  Permissions: ${response.data.data.key?.permissions?.length || 0} permission(s)`));
        
        if (response.data.data.rateLimit) {
          console.log(chalk.green(`  Rate Limit: ${response.data.data.rateLimit.remaining}/${response.data.data.rateLimit.limits.minute}`));
        }
      }
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Cannot verify with API (might be offline)'));
    }
    
    console.log(chalk.gray('\n─'.repeat(50)));
    console.log(chalk.cyan('\n💡 Tips:'));
    console.log(chalk.gray('  mz login            # Re-authenticate'));
    console.log(chalk.gray('  mz config --list    # View all settings\n'));
    
  } catch (error: any) {
    console.error(chalk.red('\n❌ Error fetching user information:'));
    console.error(chalk.red(`  ${error.message}`));
  }
}
