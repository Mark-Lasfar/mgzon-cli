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
            console.log(chalk_1.default.yellow('   Add a "build" script to your package.json'));
            console.log(chalk_1.default.cyan('   Example: "build": "next build"'));
            return;
        }
        const buildCommand = 'npm run build';
        const env = { ...process.env, NODE_ENV: 'production' };
        if (options.analyze) {
            spinner.text = 'Building with analysis...';
            console.log(chalk_1.default.gray('   Debug: Using bundle analyzer'));
            try {
                if (packageJson.scripts['build:analyze']) {
                    (0, child_process_1.execSync)('npm run build:analyze', { stdio: 'inherit', cwd, env });
                }
                else {
                    (0, child_process_1.execSync)(buildCommand, { stdio: 'inherit', cwd, env });
                    console.log(chalk_1.default.yellow('   ⚠️  No analyze script found, using regular build'));
                }
            }
            catch {
                (0, child_process_1.execSync)(buildCommand, { stdio: 'inherit', cwd, env });
            }
        }
        else {
            spinner.text = 'Building for production...';
            console.log(chalk_1.default.gray('   Debug: Running npm run build'));
            (0, child_process_1.execSync)(buildCommand, { stdio: 'inherit', cwd, env });
        }
        spinner.succeed(chalk_1.default.green('✅ Build completed successfully!'));
        const buildDir = options.outputDirectory || '.next';
        const buildPath = path_1.default.join(cwd, buildDir);
        if (fs_extra_1.default.existsSync(buildPath)) {
            const buildStats = await getBuildStats(buildPath);
            console.log(chalk_1.default.cyan('\n📊 Build Statistics\n'));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            console.log(chalk_1.default.green(`Output directory: ${buildDir}`));
            console.log(chalk_1.default.green(`Node.js environment: ${env.NODE_ENV}`));
            if (buildStats.totalSize) {
                console.log(chalk_1.default.green(`Total size: ${Math.round(buildStats.totalSize / 1024 / 1024)} MB`));
            }
            if (buildStats.fileCount) {
                console.log(chalk_1.default.green(`Files: ${buildStats.fileCount}`));
            }
            const requiredFiles = ['BUILD_ID', 'static'];
            const missingFiles = requiredFiles.filter(file => !fs_extra_1.default.existsSync(path_1.default.join(buildPath, file)));
            if (missingFiles.length === 0) {
                console.log(chalk_1.default.green(`Status: ✅ Valid Next.js build`));
            }
            else {
                console.log(chalk_1.default.yellow(`Status: ⚠️  Missing files: ${missingFiles.join(', ')}`));
            }
            console.log(chalk_1.default.gray('─'.repeat(40)));
            console.log(chalk_1.default.yellow('\n🚀 Next Steps:'));
            console.log(chalk_1.default.cyan('   mz deploy                      # Deploy to MGZON'));
            console.log(chalk_1.default.cyan('   npx serve@latest .next         # Test locally'));
            console.log(chalk_1.default.cyan('   npx next start                 # Start production server\n'));
        }
        else {
            console.log(chalk_1.default.yellow('⚠️  Build directory not found: ' + buildDir));
            console.log(chalk_1.default.cyan('   Check your build configuration\n'));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Build failed'));
        console.error(chalk_1.default.red(`  Error: ${error.message}`));
        if (error.stderr) {
            const errorOutput = error.stderr.toString();
            console.error(chalk_1.default.red('  Build output:'));
            console.error(chalk_1.default.red(errorOutput.substring(0, 500) + '...'));
        }
        console.log(chalk_1.default.cyan('\n💡 Common solutions:'));
        console.log(chalk_1.default.gray('   1. Run: npm install'));
        console.log(chalk_1.default.gray('   2. Check for TypeScript errors'));
        console.log(chalk_1.default.gray('   3. Ensure all dependencies are installed\n'));
    }
}
async function getBuildStats(buildPath) {
    let totalSize = 0;
    let fileCount = 0;
    const collectStats = async (dir) => {
        try {
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
        }
        catch (error) {
        }
    };
    await collectStats(buildPath);
    return { totalSize, fileCount };
}
//# sourceMappingURL=build.js.map