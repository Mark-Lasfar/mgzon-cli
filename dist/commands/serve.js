"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveCommand = serveCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
async function serveCommand(options) {
    const spinner = (0, ora_1.default)('Starting development server...').start();
    try {
        const port = options.port || 3000;
        const host = options.host || 'localhost';
        const packagePath = path_1.default.join(process.cwd(), 'package.json');
        if (!await fs_extra_1.default.pathExists(packagePath)) {
            spinner.fail(chalk_1.default.red('package.json not found'));
            console.log(chalk_1.default.yellow('Run this command from your project directory'));
            return;
        }
        const packageJson = await fs_extra_1.default.readJson(packagePath);
        const isNextApp = packageJson.dependencies?.next || packageJson.devDependencies?.next;
        if (isNextApp) {
            const server = (0, child_process_1.spawn)('npx', ['next', 'dev', '-p', port, '-H', host], {
                stdio: 'inherit',
                shell: true
            });
            spinner.succeed(chalk_1.default.green(`Development server started on http://${host}:${port}`));
            console.log('\n' + chalk_1.default.bold('Webhook Testing:'));
            if (options.webhookUrl) {
                console.log(chalk_1.default.cyan(`  Webhook URL: ${options.webhookUrl}`));
                console.log(chalk_1.default.cyan('  Use mz webhook --simulate to test\n'));
            }
            process.on('SIGINT', () => {
                console.log(chalk_1.default.yellow('\n\nStopping server...'));
                server.kill();
                process.exit(0);
            });
        }
        else {
            spinner.fail(chalk_1.default.red('Next.js not found in dependencies'));
            console.log(chalk_1.default.yellow('Run mz init first to create a Next.js app'));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to start server'));
        console.error(error);
    }
}
//# sourceMappingURL=serve.js.map