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
        }
        if (!apiKey || apiKey.trim().length < 10) {
            spinner.fail();
            throw new Error('Invalid API key format. Key must be at least 10 characters.');
        }
        const userData = await (0, config_1.loginCommand)(apiKey);
        spinner.succeed(chalk_1.default.green('✅ Login successful!'));
        console.log(chalk_1.default.cyan('\n' + '─'.repeat(50)));
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
        console.log(chalk_1.default.cyan('\n' + '─'.repeat(50)));
        console.log(chalk_1.default.bold('🚀 Next Steps:'));
        console.log(chalk_1.default.yellow('  mz init my-app'));
        console.log(chalk_1.default.yellow('  mz apps --list'));
        console.log(chalk_1.default.yellow('  mz deploy\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Login failed'));
        console.error(chalk_1.default.red(`  Error: ${error.message}`));
        console.log(chalk_1.default.cyan('\n' + '─'.repeat(50)));
        console.log(chalk_1.default.bold('🔑 How to get API key:'));
        console.log(chalk_1.default.cyan('  1. Go to https://mgzon.com/developers'));
        console.log(chalk_1.default.cyan('  2. Login to your account'));
        console.log(chalk_1.default.cyan('  3. Go to Settings → API Keys'));
        console.log(chalk_1.default.cyan('  4. Generate a new API key\n'));
        console.log(chalk_1.default.yellow('💡 Tip: Use environment variable:'));
        console.log(chalk_1.default.cyan('  export MGZON_API_KEY="your_api_key_here"\n'));
        process.exit(1);
    }
}
//# sourceMappingURL=login.js.map