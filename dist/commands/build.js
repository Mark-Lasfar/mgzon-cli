"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommand = buildCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const child_process_1 = require("child_process");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
async function buildCommand(options) {
    const spinner = (0, ora_1.default)('Building project...').start();
    try {
        const cwd = process.cwd();
        const packagePath = path_1.default.join(cwd, 'package.json');
        if (!fs_extra_1.default.existsSync(packagePath)) {
            spinner.fail(chalk_1.default.red('package.json not found'));
            console.log(chalk_1.default.yellow('Run this command from your project directory'));
            return;
        }
        const packageJson = await fs_extra_1.default.readJson(packagePath);
        if (!packageJson.scripts?.build) {
            spinner.fail(chalk_1.default.red('No build script found in package.json'));
            return;
        }
        const buildCommand = 'npm run build';
        if (options.analyze) {
            spinner.text = 'Building with analysis...';
            try {
                (0, child_process_1.execSync)('npm run build:analyze', { stdio: 'inherit', cwd });
            }
            catch {
                (0, child_process_1.execSync)(buildCommand, { stdio: 'inherit', cwd });
            }
        }
        else {
            (0, child_process_1.execSync)(buildCommand, { stdio: 'inherit', cwd });
        }
        spinner.succeed(chalk_1.default.green('✅ Build completed successfully!'));
        const buildDir = options.outputDirectory || '.next';
        const buildPath = path_1.default.join(cwd, buildDir);
        if (fs_extra_1.default.existsSync(buildPath)) {
            const buildStats = await getBuildStats(buildPath);
            console.log(chalk_1.default.cyan('\n📊 Build Statistics\n'));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            console.log(chalk_1.default.green(`Output directory: ${buildDir}`));
            if (buildStats.totalSize) {
                console.log(chalk_1.default.green(`Total size: ${Math.round(buildStats.totalSize / 1024 / 1024)} MB`));
            }
            if (buildStats.fileCount) {
                console.log(chalk_1.default.green(`Files: ${buildStats.fileCount}`));
            }
            console.log(chalk_1.default.gray('─'.repeat(40)));
            console.log(chalk_1.default.yellow('\n🚀 Next: Deploy your app with:'));
            console.log(chalk_1.default.cyan('  mz deploy\n'));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Build failed'));
        console.error(chalk_1.default.red(`  Error: ${error.message}`));
        if (error.stderr) {
            console.error(chalk_1.default.red(`  ${error.stderr.toString()}`));
        }
    }
}
async function getBuildStats(buildPath) {
    let totalSize = 0;
    let fileCount = 0;
    const collectStats = async (dir) => {
        const files = await fs_extra_1.default.readdir(dir);
        for (const file of files) {
            const filePath = path_1.default.join(dir, file);
            const stat = await fs_extra_1.default.stat(filePath);
            if (stat.isDirectory()) {
                await collectStats(filePath);
            }
            else {
                totalSize += stat.size;
                fileCount++;
            }
        }
    };
    await collectStats(buildPath);
    return { totalSize, fileCount };
}
//# sourceMappingURL=build.js.map