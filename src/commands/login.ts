// /workspaces/mgzon-cli/src/commands/login.ts
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { loginCommand as apiLogin, getApiUrl } from '../utils/config';

export async function loginCommand(options: any) {
  const spinner = ora('Logging in...').start();

  try {
    let apiKey = options.apiKey;

    // ⭐⭐ إصلاح: لو المفتاح مش موجود، نعرض رسالة واضحة
    if (!apiKey) {
      const apiUrl = await getApiUrl();
      console.log(chalk.gray(`   Debug: Using API URL: ${apiUrl}`));
      
      // ⭐⭐ إصلاح: نوقف الـ spinner عشان المستخدم يشوف الـ prompt
      spinner.stop();
      
      console.log(chalk.cyan('\n' + '═'.repeat(50)));
      console.log(chalk.bold('🔐 MGZON Login'));
      console.log(chalk.cyan('═'.repeat(50)));
      
      // ⭐⭐ نطلب API key بشكل واضح
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
      
      // ⭐⭐ نبدأ spinner تاني
      spinner.start('Validating API key...');
    }

    if (!apiKey || apiKey.trim().length < 10) {
      spinner.fail();
      throw new Error('Invalid API key format. Key must be at least 10 characters.');
    }

    // ✅ إضافة debug قبل الـ login
    console.log(chalk.gray(`   Debug: Attempting login with API key: ${apiKey.substring(0, 8)}...`));
    
    // Validate and save
    spinner.text = 'Validating API key...';
    const userData = await apiLogin(apiKey);
    
    spinner.succeed(chalk.green('✅ Login successful!'));
    
    console.log(chalk.cyan('\n' + '═'.repeat(50)));
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
    
    console.log(chalk.cyan('═'.repeat(50)));
    
    // ⭐⭐ إضافة: نصائح للمستخدم
    console.log(chalk.bold('\n🚀 Next Steps:'));
    console.log(chalk.yellow('  mz whoami                        # Check your account'));
    console.log(chalk.yellow('  mz apps --list                   # List your apps'));
    console.log(chalk.yellow('  mz init my-app                   # Create new app'));
    console.log(chalk.yellow('  mz deploy                        # Deploy an app'));
    
    // ⭐⭐ إضافة: حفظ المفتاح في environment variable تلقائياً
    console.log(chalk.bold('\n💡 Pro Tip:'));
    console.log(chalk.cyan(`  export MGZON_API_KEY="${apiKey}"`));
    console.log(chalk.cyan('  This will skip login prompts in future sessions\n'));
    
    // ⭐⭐ إضافة: رابط للحصول على مفتاح جديد
    console.log(chalk.gray('🔗 Get API keys from: https://mgzon.com/developers/keys\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Login failed'));
    console.error(chalk.red(`  Error: ${error.message}`));
    
    // ✅ إضافة معلومات debugging مفيدة
    console.log(chalk.cyan('\n' + '═'.repeat(50)));
    console.log(chalk.bold('🔧 Debug Information:'));
    console.log(chalk.cyan(`  API URL: ${await getApiUrl()}`));
    
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.yellow('  ❗ Cannot connect to API server'));
      console.log(chalk.cyan('    → Is your server running?'));
      console.log(chalk.cyan('    → Try using ngrok for remote access:'));
      console.log(chalk.gray('      1. Install ngrok: https://ngrok.com/download'));
      console.log(chalk.gray('      2. Run: ngrok http 3000'));
      console.log(chalk.gray('      3. Set API URL: mz config --set apiUrl=https://YOUR_NGROK_URL.ngrok.io/api/v1'));
    } else if (error.response) {
      console.log(chalk.yellow(`  ❗ API Error ${error.response.status}: ${error.response.statusText}`));
      console.log(chalk.cyan(`    → URL: ${error.config?.url}`));
      
      if (error.response.data?.error) {
        console.log(chalk.cyan(`    → Error: ${error.response.data.error}`));
      }
    }
    
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.bold('🔑 How to get API key:'));
    console.log(chalk.cyan('  1. Go to https://mgzon.com/developers'));
    console.log(chalk.cyan('  2. Login to your account'));
    console.log(chalk.cyan('  3. Go to Settings → API Keys'));
    console.log(chalk.cyan('  4. Generate a new API key\n'));
    
    console.log(chalk.yellow('💡 Quick Commands:'));
    console.log(chalk.cyan('  # Use environment variable (easiest)'));
    console.log(chalk.cyan('  export MGZON_API_KEY="your_api_key_here"'));
    console.log(chalk.cyan('  mz whoami\n'));
    
    console.log(chalk.cyan('🎯 Quick Fixes:'));
    console.log(chalk.cyan('  # Set API URL for local development'));
    console.log(chalk.cyan('  mz config --set apiUrl=http://localhost:3000/api/v1'));
    console.log(chalk.cyan('\n  # Set API URL for ngrok (remote access)'));
    console.log(chalk.cyan('  mz config --set apiUrl=https://YOUR_NGROK_URL.ngrok.io/api/v1\n'));
    
    process.exit(1);
  }
}