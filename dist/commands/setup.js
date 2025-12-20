"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCommand = setupCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../utils/config");
async function setupCommand() {
    console.log(chalk_1.default.blue(`
  __  __    ____   _____   ___    _   _      ____   _       ___ 
 |  \\/  |  / ___| |__  /  / _ \\  | \\ | |    / ___| | |     |_ _|
 | |\\/| | | |  _    / /  | | | | |  \\| |   | |     | |      | | 
 | |  | | | |_| |  / /_  | |_| | | |\\  |   | |___  | |___   | | 
 |_|  |_|  \\____| /____|  \\___/  |_| \\_|    \\____| |_____| |___|
                                                                
`));
    console.log(chalk_1.default.cyan('Welcome to MGZON CLI Setup!'));
    console.log(chalk_1.default.gray('This wizard will help you configure the CLI for first use.\n'));
    const config = await (0, config_1.getConfig)();
    console.log(chalk_1.default.cyan('Current configuration:'));
    console.log(chalk_1.default.gray(`  API URL: ${config.apiUrl || 'Not set'}`));
    console.log(chalk_1.default.gray(`  Authenticated: ${config.apiKey ? 'Yes' : 'No'}`));
    const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
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
            console.log(chalk_1.default.yellow('\n⚠️  To generate API keys, please visit:'));
            console.log(chalk_1.default.cyan('   https://mgzon.com/developers/keys'));
            console.log(chalk_1.default.gray('\n   Or run: mz keys --generate (after login)'));
            break;
        case 'view':
            console.log(chalk_1.default.cyan('\n📋 Current Configuration:'));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            console.log(chalk_1.default.cyan(`API URL: ${config.apiUrl || 'Not set'}`));
            console.log(chalk_1.default.cyan(`Authenticated: ${config.apiKey ? '✅ Yes' : '❌ No'}`));
            if (config.apiKey) {
                console.log(chalk_1.default.cyan(`API Key: ${config.apiKey.substring(0, 8)}...`));
            }
            console.log(chalk_1.default.cyan(`User: ${config.name || 'Not logged in'}`));
            console.log(chalk_1.default.cyan(`Email: ${config.email || 'Not set'}`));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            break;
        case 'exit':
            console.log(chalk_1.default.gray('\nGoodbye! 👋'));
            return;
    }
}
async function configureApiUrl() {
    const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
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
            validate: (input) => {
                if (!input)
                    return 'URL is required';
                try {
                    new URL(input);
                    return true;
                }
                catch {
                    return 'Please enter a valid URL';
                }
            }
        },
        {
            type: 'input',
            name: 'ngrokUrl',
            message: 'Enter your ngrok URL (e.g., https://abc123.ngrok.io):',
            when: (answers) => answers.connectionType === 'ngrok',
            validate: (input) => {
                if (!input)
                    return 'URL is required';
                try {
                    new URL(input);
                    return true;
                }
                catch {
                    return 'Please enter a valid URL';
                }
            }
        }
    ]);
    let apiUrl;
    switch (answers.connectionType) {
        case 'localhost':
            apiUrl = 'http://localhost:3000/api/v1';
            console.log(chalk_1.default.yellow('\n⚠️  Note: Make sure your MGZON server is running locally'));
            console.log(chalk_1.default.cyan('   cd /path/to/mgzon-server'));
            console.log(chalk_1.default.cyan('   npm run dev'));
            break;
        case 'ngrok':
            apiUrl = `${answers.ngrokUrl}/api/v1`;
            console.log(chalk_1.default.yellow('\n⚠️  Note: You need to run ngrok on your server:'));
            console.log(chalk_1.default.cyan('   ngrok http 3000'));
            break;
        case 'custom':
            apiUrl = answers.customUrl;
            break;
        default:
            apiUrl = 'http://localhost:3000/api/v1';
    }
    const { saveConfig } = await Promise.resolve().then(() => __importStar(require('../utils/config')));
    await saveConfig({ apiUrl });
    console.log(chalk_1.default.green('\n✅ API URL configured!'));
    console.log(chalk_1.default.cyan(`   URL: ${apiUrl}`));
    console.log(chalk_1.default.cyan('\n   Next: mz login'));
}
async function runLogin() {
    const { loginCommand } = await Promise.resolve().then(() => __importStar(require('./login')));
    await loginCommand({});
}
//# sourceMappingURL=setup.js.map