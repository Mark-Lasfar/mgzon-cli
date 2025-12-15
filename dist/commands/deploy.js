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
exports.deployCommand = deployCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = require("fs");
const os_1 = require("os");
const auth_1 = require("../middleware/auth");
async function deployCommand(options) {
    const spinner = (0, ora_1.default)('Preparing deployment...').start();
    try {
        const cwd = process.cwd();
        const packagePath = path_1.default.join(cwd, 'package.json');
        if (!(0, fs_1.existsSync)(packagePath)) {
            spinner.fail(chalk_1.default.red('Not in a project directory'));
            console.log(chalk_1.default.yellow('Navigate to your project directory first'));
            return;
        }
        const packageJson = await fs_extra_1.default.readJson(packagePath);
        const projectName = packageJson.name || path_1.default.basename(cwd);
        const buildDir = options.buildDir || '.next';
        const buildPath = path_1.default.join(cwd, buildDir);
        if (!(0, fs_1.existsSync)(buildPath) && options.build !== false) {
            spinner.text = 'Building project...';
            try {
                const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
                if (packageJson.scripts?.build) {
                    execSync('npm run build', { stdio: 'inherit', cwd });
                }
                else if (packageJson.scripts?.['build:prod']) {
                    execSync('npm run build:prod', { stdio: 'inherit', cwd });
                }
                else {
                    spinner.warn(chalk_1.default.yellow('No build script found'));
                }
            }
            catch (buildError) {
                spinner.fail(chalk_1.default.red('Build failed'));
                console.error(chalk_1.default.red(buildError.message));
                return;
            }
        }
        spinner.text = 'Creating deployment package...';
        const zipBuffer = await createDeploymentPackage(cwd, buildDir);
        if (!zipBuffer || zipBuffer.length === 0) {
            spinner.fail(chalk_1.default.red('Failed to create deployment package'));
            return;
        }
        let appId = options.appId;
        const environment = options.env || 'production';
        const version = packageJson.version || '1.0.0';
        if (!appId) {
            const mgzonConfigPath = path_1.default.join(cwd, '.mgzon.json');
            if ((0, fs_1.existsSync)(mgzonConfigPath)) {
                const mgzonConfig = await fs_extra_1.default.readJson(mgzonConfigPath);
                appId = mgzonConfig.appId;
            }
            if (!appId) {
                spinner.fail(chalk_1.default.red('App ID not found'));
                console.log(chalk_1.default.yellow('Please specify app ID with --app-id=<id>'));
                console.log(chalk_1.default.yellow('Or create an app first with: mz apps --create'));
                return;
            }
        }
        if (!options.autoApprove) {
            spinner.stop();
            const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Deploy ${projectName} v${version} to ${environment}?`,
                    default: false
                }
            ]);
            if (!confirm) {
                spinner.fail(chalk_1.default.yellow('Deployment cancelled'));
                return;
            }
            spinner.start('Deploying...');
        }
        spinner.text = 'Uploading to MGZON...';
        const headers = await (0, auth_1.getAuthHeaders)();
        const formData = new FormData();
        const fileBlob = new Blob([zipBuffer], { type: 'application/zip' });
        formData.append('file', fileBlob, 'deployment.zip');
        formData.append('appId', appId);
        formData.append('appName', projectName);
        formData.append('environment', environment);
        formData.append('version', version);
        formData.append('type', 'nextjs');
        if (packageJson.description) {
            formData.append('description', packageJson.description);
        }
        if (options.buildCommand) {
            formData.append('buildCommand', options.buildCommand);
        }
        const response = await axios_1.default.post(await (0, auth_1.buildApiUrl)('/deploy'), formData, {
            headers: {
                'Authorization': headers.Authorization,
                'Content-Type': 'multipart/form-data'
            }
        });
        if (!response.data.success) {
            throw new Error(response.data.error || 'Deployment failed');
        }
        const deployData = response.data.data;
        spinner.succeed(chalk_1.default.green('✅ App deployed successfully!'));
        console.log(chalk_1.default.cyan('\n' + '─'.repeat(50)));
        console.log(chalk_1.default.bold('🚀 Deployment Details'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.green(`App:        ${deployData.appName}`));
        console.log(chalk_1.default.green(`Version:    ${deployData.version}`));
        console.log(chalk_1.default.green(`Environment: ${deployData.environment}`));
        console.log(chalk_1.default.green(`Status:     ${deployData.status}`));
        console.log(chalk_1.default.green(`Deployment ID: ${deployData.deploymentId}`));
        if (deployData.url) {
            console.log(chalk_1.default.green(`URL:        ${deployData.url}`));
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        if (deployData.logs && deployData.logs.length > 0) {
            console.log(chalk_1.default.cyan('\n📋 Deployment Logs:'));
            deployData.logs.forEach((log, index) => {
                console.log(chalk_1.default.gray(`  ${index + 1}. ${log}`));
            });
        }
        if (deployData.nextSteps && deployData.nextSteps.length > 0) {
            console.log(chalk_1.default.cyan('\n👉 Next Steps:'));
            deployData.nextSteps.forEach((step, index) => {
                console.log(chalk_1.default.yellow(`  ${index + 1}. ${step}`));
            });
        }
        console.log(chalk_1.default.gray('\n' + '─'.repeat(50)));
        console.log(chalk_1.default.cyan('📊 View deployment status:'));
        console.log(chalk_1.default.yellow(`  mz apps --logs ${deployData.appId}`));
        console.log(chalk_1.default.cyan('🔗 Download deployment:'));
        console.log(chalk_1.default.yellow(`  ${deployData.downloadUrl}\n`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Deployment failed'));
        if (error.response) {
            const errorData = error.response.data;
            console.error(chalk_1.default.red(`  Error ${error.response.status}: ${errorData?.error || errorData?.message || 'API error'}`));
            if (errorData?.details) {
                console.error(chalk_1.default.red(`  Details: ${errorData.details}`));
            }
        }
        else {
            console.error(chalk_1.default.red(`  Error: ${error.message}`));
        }
        console.log(chalk_1.default.yellow('\n💡 Troubleshooting:'));
        console.log(chalk_1.default.cyan('  1. Check your API key: mz whoami'));
        console.log(chalk_1.default.cyan('  2. Verify app exists: mz apps --list'));
        console.log(chalk_1.default.cyan('  3. Check network connection\n'));
    }
}
async function createDeploymentPackage(projectDir, buildDir) {
    return new Promise((resolve, reject) => {
        const tempFile = path_1.default.join((0, os_1.tmpdir)(), `mgzon-deploy-${Date.now()}.zip`);
        const output = (0, fs_1.createWriteStream)(tempFile);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        output.on('close', async () => {
            try {
                const buffer = await fs_extra_1.default.readFile(tempFile);
                await fs_extra_1.default.remove(tempFile);
                resolve(buffer);
            }
            catch (error) {
                reject(error);
            }
        });
        archive.on('error', reject);
        archive.pipe(output);
        const buildPath = path_1.default.join(projectDir, buildDir);
        if ((0, fs_1.existsSync)(buildPath)) {
            archive.directory(buildPath, buildDir);
        }
        const publicPath = path_1.default.join(projectDir, 'public');
        if ((0, fs_1.existsSync)(publicPath)) {
            archive.directory(publicPath, 'public');
        }
        const packagePath = path_1.default.join(projectDir, 'package.json');
        if ((0, fs_1.existsSync)(packagePath)) {
            archive.file(packagePath, { name: 'package.json' });
        }
        const mgzonConfigPath = path_1.default.join(projectDir, '.mgzon.json');
        if ((0, fs_1.existsSync)(mgzonConfigPath)) {
            archive.file(mgzonConfigPath, { name: '.mgzon.json' });
        }
        const nextConfigPath = path_1.default.join(projectDir, 'next.config.js');
        if ((0, fs_1.existsSync)(nextConfigPath)) {
            archive.file(nextConfigPath, { name: 'next.config.js' });
        }
        archive.finalize();
    });
}
//# sourceMappingURL=deploy.js.map