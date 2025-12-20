"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCommand = loginCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../utils/config");
async function loginCommand(options) {
    const spinner = (0, ora_1.default)('Logging in...').start();
    try {
        let apiKey = options.apiKey;
        if (!apiKey) {
            const apiUrl = await (0, config_1.getApiUrl)();
            console.log(chalk_1.default.gray(`   Debug: Using API URL: ${apiUrl}`));
            spinner.stop();
            console.log(chalk_1.default.cyan('\n' + '═'.repeat(50)));
            console.log(chalk_1.default.bold('🔐 MGZON Login'));
            console.log(chalk_1.default.cyan('═'.repeat(50)));
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'password',
                    name: 'apiKey',
                    message: 'Enter your MGZON API Key:',
                    mask: '*',
                    validate: (input) => {
                        if (!input || input.trim().length < 10) {
                            return 'API key must be at least 10 characters';
                        }
                        return true;
                    }
                }
            ]);
            apiKey = answers.apiKey;
            spinner.start('Validating API key...');
        }
        if (!apiKey || apiKey.trim().length < 10) {
            spinner.fail();
            throw new Error('Invalid API key format. Key must be at least 10 characters.');
        }
        console.log(chalk_1.default.gray(`   Debug: Attempting login with API key: ${apiKey.substring(0, 8)}...`));
        spinner.text = 'Validating API key...';
        const userData = await (0, config_1.loginCommand)(apiKey);
        spinner.succeed(chalk_1.default.green('✅ Login successful!'));
        console.log(chalk_1.default.cyan('\n' + '═'.repeat(50)));
        console.log(chalk_1.default.bold('📋 Account Information:'));
        console.log(chalk_1.default.cyan(`  👤 Name: ${userData.name || 'N/A'}`));
        console.log(chalk_1.default.cyan(`  📧 Email: ${userData.email}`));
        console.log(chalk_1.default.cyan(`  🎯 Role: ${userData.role || 'Developer'}`));
        if (userData.isDeveloper) {
            console.log(chalk_1.default.cyan('  🛠️  Type: Developer'));
        }
        else if (userData.isSeller) {
            console.log(chalk_1.default.cyan('  🏪 Type: Seller'));
        }
        else if (userData.isAdmin) {
            console.log(chalk_1.default.cyan('  🔧 Type: Admin'));
        }
        console.log(chalk_1.default.cyan('═'.repeat(50)));
        console.log(chalk_1.default.bold('\n🚀 Next Steps:'));
        console.log(chalk_1.default.yellow('  mz whoami                        # Check your account'));
        console.log(chalk_1.default.yellow('  mz apps --list                   # List your apps'));
        console.log(chalk_1.default.yellow('  mz init my-app                   # Create new app'));
        console.log(chalk_1.default.yellow('  mz deploy                        # Deploy an app'));
        console.log(chalk_1.default.bold('\n💡 Pro Tip:'));
        console.log(chalk_1.default.cyan(`  export MGZON_API_KEY="${apiKey}"`));
        console.log(chalk_1.default.cyan('  This will skip login prompts in future sessions\n'));
        console.log(chalk_1.default.gray('🔗 Get API keys from: https://mgzon.com/developers/keys\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Login failed'));
        console.error(chalk_1.default.red(`  Error: ${error.message}`));
        console.log(chalk_1.default.cyan('\n' + '═'.repeat(50)));
        console.log(chalk_1.default.bold('🔧 Debug Information:'));
        console.log(chalk_1.default.cyan(`  API URL: ${await (0, config_1.getApiUrl)()}`));
        if (error.code === 'ECONNREFUSED') {
            console.log(chalk_1.default.yellow('  ❗ Cannot connect to API server'));
            console.log(chalk_1.default.cyan('    → Is your server running?'));
            console.log(chalk_1.default.cyan('    → Try using ngrok for remote access:'));
            console.log(chalk_1.default.gray('      1. Install ngrok: https://ngrok.com/download'));
            console.log(chalk_1.default.gray('      2. Run: ngrok http 3000'));
            console.log(chalk_1.default.gray('      3. Set API URL: mz config --set apiUrl=https://YOUR_NGROK_URL.ngrok.io/api/v1'));
        }
        else if (error.response) {
            console.log(chalk_1.default.yellow(`  ❗ API Error ${error.response.status}: ${error.response.statusText}`));
            console.log(chalk_1.default.cyan(`    → URL: ${error.config?.url}`));
            if (error.response.data?.error) {
                console.log(chalk_1.default.cyan(`    → Error: ${error.response.data.error}`));
            }
        }
        console.log(chalk_1.default.cyan('═'.repeat(50)));
        console.log(chalk_1.default.bold('🔑 How to get API key:'));
        console.log(chalk_1.default.cyan('  1. Go to https://mgzon.com/developers'));
        console.log(chalk_1.default.cyan('  2. Login to your account'));
        console.log(chalk_1.default.cyan('  3. Go to Settings → API Keys'));
        console.log(chalk_1.default.cyan('  4. Generate a new API key\n'));
        console.log(chalk_1.default.yellow('💡 Quick Commands:'));
        console.log(chalk_1.default.cyan('  # Use environment variable (easiest)'));
        console.log(chalk_1.default.cyan('  export MGZON_API_KEY="your_api_key_here"'));
        console.log(chalk_1.default.cyan('  mz whoami\n'));
        console.log(chalk_1.default.cyan('🎯 Quick Fixes:'));
        console.log(chalk_1.default.cyan('  # Set API URL for local development'));
        console.log(chalk_1.default.cyan('  mz config --set apiUrl=http://localhost:3000/api/v1'));
        console.log(chalk_1.default.cyan('\n  # Set API URL for ngrok (remote access)'));
        console.log(chalk_1.default.cyan('  mz config --set apiUrl=https://YOUR_NGROK_URL.ngrok.io/api/v1\n'));
        process.exit(1);
    }
}
//# sourceMappingURL=login.js.map