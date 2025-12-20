// /workspaces/mgzon-cli/src/commands/whoami.ts
import chalk from 'chalk';
import { getConfig, getApiKey, getApiUrl, getUserInfo } from '../utils/config';
import axios from 'axios';

export async function whoamiCommand() {
  try {
    const config = await getConfig();
    const apiKey = await getApiKey();
    const apiUrl = await getApiUrl();
    
    console.log(chalk.gray(`   Debug: API URL: ${apiUrl}`));
    
    if (!apiKey) {
      console.log(chalk.yellow('\n' + '─'.repeat(50)));
      console.log(chalk.yellow('⚠️  You are not logged in.'));
      console.log(chalk.yellow('─'.repeat(50)));
      console.log(chalk.cyan('   Run: mz login to authenticate'));
      console.log(chalk.cyan(`   Current API URL: ${apiUrl}`));
      console.log(chalk.cyan('   Or set MGZON_API_KEY environment variable\n'));
      return;
    }
    
    console.log(chalk.cyan('\n' + '═'.repeat(50)));
    console.log(chalk.bold.cyan('👤 Your Account Information'));
    console.log(chalk.cyan('═'.repeat(50)));
    
    // Get user info from config
    const userInfo = await getUserInfo();
    
    if (userInfo.email) {
      console.log(chalk.green('✅ You are logged in:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.cyan(`   👤 Name: ${userInfo.name || 'Not available'}`));
      console.log(chalk.cyan(`   📧 Email: ${userInfo.email}`));
      console.log(chalk.cyan(`   🆔 User ID: ${userInfo.userId ? userInfo.userId.substring(0, 8) + '...' : 'Not available'}`));
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
      console.log(chalk.gray('─'.repeat(40)));
    } else {
      console.log(chalk.yellow('⚠️  No user info found in config'));
    }
    
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.cyan(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`));
    console.log(chalk.cyan(`🌐 API URL: ${apiUrl}`));
    
    if (config.lastLogin) {
      console.log(chalk.cyan(`📅 Last login: ${new Date(config.lastLogin).toLocaleString()}`));
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    
    // Try to get live API status
    console.log(chalk.cyan('\n📊 Live API Status:'));
    console.log(chalk.gray('─'.repeat(40)));
    
    try {
      // ⭐⭐ التصحيح هنا: apiUrl هو كامل المسار، مش محتاج نضيف /api/v1 تاني
      console.log(chalk.gray(`   Debug: Verifying API key at: ${apiUrl}/auth/verify`));
      
      const response = await axios.post(`${apiUrl}/auth/verify`, {}, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.data.success) {
        console.log(chalk.green('   ✓ API Key Verified: ✅'));
        
        const userData = response.data.data?.user;
        const keyData = response.data.data?.key;
        
        if (userData) {
          console.log(chalk.cyan(`   👤 Live Name: ${userData.name || userData.email}`));
          console.log(chalk.cyan(`   🎯 Live Role: ${userData.role || userData.type || 'Unknown'}`));
        }
        
        if (keyData) {
          console.log(chalk.cyan(`   🔑 Key Name: ${keyData.name || 'Unnamed'}`));
          console.log(chalk.cyan(`   🔧 Key Type: ${keyData.type || 'Unknown'}`));
          console.log(chalk.cyan(`   📋 Permissions: ${keyData.permissions?.length || 0} permission(s)`));
          
          if (keyData.expiresAt) {
            const expiresDate = new Date(keyData.expiresAt);
            const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const color = daysLeft < 7 ? 'red' : daysLeft < 30 ? 'yellow' : 'green';
            console.log(chalk[color](`   ⏳ Expires in: ${daysLeft} days`));
          } else {
            console.log(chalk.green(`   ∞ Expires: Never`));
          }
        }
        
        if (response.data.data?.rateLimit) {
          const rateLimit = response.data.data.rateLimit;
          console.log(chalk.cyan(`   🚦 Rate Limit: ${rateLimit.remaining || '?'}/${rateLimit.limits?.minute || '?'}`));
        }
        
      } else {
        console.log(chalk.yellow('   ⚠️ API Key verification failed'));
        console.log(chalk.red(`   Error: ${response.data.error || 'Unknown error'}`));
      }
      
    } catch (error: any) {
      console.log(chalk.red('   ❌ Cannot verify with API'));
      
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.yellow(`   ⚠️  Connection refused at: ${apiUrl}`));
        console.log(chalk.cyan(`   💡 Check if server is running: http://localhost:3000`));
      } else if (error.response?.status === 401) {
        console.log(chalk.red(`   🔐 API key is invalid or expired`));
        console.log(chalk.cyan(`   💡 Run: mz login to get a new key`));
      } else if (error.message) {
        console.log(chalk.red(`   Error: ${error.message}`));
      }
      
      console.log(chalk.gray(`   Debug URL: ${apiUrl}/auth/verify`));
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    
    // API connection test
    try {
      const { testApiConnection } = await import('../utils/config');
      const testResult = await testApiConnection();
      
      console.log(chalk.cyan('\n🌐 Connection Test:'));
      console.log(chalk.gray('─'.repeat(40)));
      
      if (testResult.success) {
        console.log(chalk.green('   ✓ API Server: Reachable ✅'));
        console.log(chalk.cyan(`   📍 URL: ${testResult.url}`));
      } else {
        console.log(chalk.red('   ❌ API Server: Unreachable'));
        console.log(chalk.yellow(`   ⚠️  URL: ${testResult.url}`));
        if (testResult.error) {
          console.log(chalk.red(`   Error: ${testResult.error}`));
        }
      }
    } catch {
      console.log(chalk.red('   ❌ Connection test failed'));
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    
    // Configuration summary
    console.log(chalk.cyan('\n⚙️  Configuration:'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.cyan(`   Config file: ~/.mgzon/config.json`));
    console.log(chalk.cyan(`   API URL: ${apiUrl}`));
    console.log(chalk.cyan(`   Environment: ${config.defaultEnvironment || 'development'}`));
    console.log(chalk.cyan(`   Current project: ${config.currentProject || 'None'}`));
    
    console.log(chalk.gray('─'.repeat(50)));
    
    // Tips
    console.log(chalk.cyan('\n💡 Tips:'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.yellow('   mz login                 # Re-authenticate'));
    console.log(chalk.yellow('   mz config --list         # View all settings'));
    console.log(chalk.yellow('   mz config --get apiUrl   # Check current API URL'));
    console.log(chalk.yellow('   mz apps --list           # List your apps'));
    console.log(chalk.yellow('   mz keys --list           # List API keys'));
    console.log(chalk.gray('─'.repeat(40)));
    
  } catch (error: any) {
    console.error(chalk.red('\n' + '─'.repeat(50)));
    console.error(chalk.bold.red('❌ Error fetching user information:'));
    console.error(chalk.red('─'.repeat(50)));
    console.error(chalk.red(`   ${error.message}`));
    
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.cyan('\n🔧 Troubleshooting:'));
      console.log(chalk.cyan('   1. Check if MGZON API server is running'));
      console.log(chalk.cyan('      Run: curl http://localhost:3000/api/v1/health'));
      console.log(chalk.cyan('   2. Check API URL configuration:'));
      console.log(chalk.cyan('      mz config --get apiUrl'));
      console.log(chalk.cyan('   3. Set correct API URL:'));
      console.log(chalk.cyan('      mz config --set apiUrl=http://localhost:3000/api/v1'));
    }
    
    console.log(chalk.red('─'.repeat(50)));
  }
}