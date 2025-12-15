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
                apiUrl: 'https://api.mgzon.com/v1',
                defaultEnvironment: 'staging'
            };
            await (0, config_1.saveConfig)(defaultConfig);
            spinner.succeed(chalk_1.default.green('✅ Configuration reset to defaults'));
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
        console.log(chalk_1.default.gray('─'.repeat(50)));
        for (const [key, value] of Object.entries(config)) {
            const displayValue = key === 'apiKey' && value
                ? `${value.substring(0, 10)}...`
                : value || chalk_1.default.gray('(not set)');
            console.log(`${chalk_1.default.cyan(key.padEnd(20))}: ${displayValue}`);
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.gray('\nUsage:'));
        console.log(chalk_1.default.cyan('  mz config --list                  ') + chalk_1.default.gray('# List all config'));
        console.log(chalk_1.default.cyan('  mz config --set theme=dark        ') + chalk_1.default.gray('# Set a config value'));
        console.log(chalk_1.default.cyan('  mz config --get apiUrl            ') + chalk_1.default.gray('# Get a config value'));
        console.log(chalk_1.default.cyan('  mz config --reset                 ') + chalk_1.default.gray('# Reset to defaults\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Config command failed'));
        console.error(chalk_1.default.red(`  Error: ${error.message}`));
    }
}
//# sourceMappingURL=config.js.map