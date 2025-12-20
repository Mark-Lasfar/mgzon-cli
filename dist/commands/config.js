"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommand = configCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../utils/config");
async function configCommand(options) {
    const spinner = (0, ora_1.default)('Processing...').start();
    try {
        const config = await (0, config_1.getConfig)();
        if (options.reset) {
            const defaultConfig = {
                apiUrl: 'http://localhost:3000/api/v1',
                defaultEnvironment: 'development'
            };
            await (0, config_1.saveConfig)(defaultConfig);
            spinner.succeed(chalk_1.default.green('✅ Configuration reset to defaults'));
            console.log(chalk_1.default.gray('\n─'.repeat(40)));
            console.log(chalk_1.default.cyan('New Configuration:'));
            console.log(chalk_1.default.cyan(`  apiUrl: http://localhost:3000/api/v1`));
            console.log(chalk_1.default.cyan(`  defaultEnvironment: development`));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            return;
        }
        if (options.set) {
            const [key, value] = options.set.split('=');
            if (!key || !value) {
                throw new Error('Invalid format. Use: --set key=value');
            }
            const validKeys = ['apiUrl', 'defaultEnvironment', 'theme', 'editor'];
            if (!validKeys.includes(key)) {
                throw new Error(`Invalid key. Valid keys: ${validKeys.join(', ')}`);
            }
            if (key === 'apiUrl') {
                try {
                    const url = new URL(value);
                    if (!value.includes('/api/v1')) {
                        console.log(chalk_1.default.yellow('⚠️  Warning: apiUrl should end with /api/v1'));
                        console.log(chalk_1.default.cyan('   Example: http://localhost:3000/api/v1'));
                    }
                }
                catch {
                    throw new Error('Invalid URL format');
                }
            }
            await (0, config_1.saveConfig)({ [key]: value });
            spinner.succeed(chalk_1.default.green(`✅ Set ${key} = ${value}`));
            return;
        }
        if (options.get) {
            const value = config[options.get];
            spinner.stop();
            if (value === undefined) {
                console.log(chalk_1.default.yellow(`⚠️  ${options.get} is not set`));
            }
            else {
                console.log(chalk_1.default.green(`${options.get} = ${value}`));
            }
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.cyan('\n⚙️  MGZON CLI Configuration\n'));
        console.log(chalk_1.default.gray('─'.repeat(60)));
        console.log(chalk_1.default.gray('Debug Info:'));
        console.log(chalk_1.default.gray(`  Current Directory: ${process.cwd()}`));
        console.log(chalk_1.default.gray(`  Config File: ${process.env.HOME}/.mgzon/config.json`));
        console.log(chalk_1.default.gray('─'.repeat(60)));
        for (const [key, value] of Object.entries(config)) {
            const displayValue = key === 'apiKey' && value
                ? `${value.substring(0, 10)}...`
                : value || chalk_1.default.gray('(not set)');
            let valueColor = chalk_1.default.white;
            if (key === 'apiUrl') {
                if (value?.includes('localhost')) {
                    valueColor = chalk_1.default.green;
                }
                else if (value?.includes('api.mgzon.com')) {
                    valueColor = chalk_1.default.yellow;
                }
            }
            console.log(`${chalk_1.default.cyan(key.padEnd(20))}: ${valueColor(displayValue)}`);
        }
        console.log(chalk_1.default.gray('─'.repeat(60)));
        console.log(chalk_1.default.yellow('\n💡 Tips:'));
        console.log(chalk_1.default.cyan('  For local development:'));
        console.log(chalk_1.default.gray('    mz config --set apiUrl=http://localhost:3000/api/v1'));
        console.log(chalk_1.default.cyan('\n  To test API connection:'));
        console.log(chalk_1.default.gray('    curl http://localhost:3000/api/v1/health'));
        console.log(chalk_1.default.gray('\n' + '─'.repeat(60)));
        console.log(chalk_1.default.gray('\nUsage:'));
        console.log(chalk_1.default.cyan('  mz config --list                  ') + chalk_1.default.gray('# List all config'));
        console.log(chalk_1.default.cyan('  mz config --set theme=dark        ') + chalk_1.default.gray('# Set a config value'));
        console.log(chalk_1.default.cyan('  mz config --get apiUrl            ') + chalk_1.default.gray('# Get a config value'));
        console.log(chalk_1.default.cyan('  mz config --reset                 ') + chalk_1.default.gray('# Reset to defaults\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Config command failed'));
        console.error(chalk_1.default.red(`  Error: ${error.message}`));
        console.log(chalk_1.default.cyan('\n🔧 Debug Information:'));
        console.log(chalk_1.default.gray(`  Current dir: ${process.cwd()}`));
        console.log(chalk_1.default.gray(`  Node version: ${process.version}`));
        console.log(chalk_1.default.gray(`  Platform: ${process.platform}`));
    }
}
//# sourceMappingURL=config.js.map