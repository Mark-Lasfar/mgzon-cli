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
const config_1 = require("../utils/config");
async function deployCommand(options) {
    const spinner = (0, ora_1.default)('Preparing deployment...').start();
    try {
        const apiUrl = await (0, config_1.getApiUrl)();
        console.log(chalk_1.default.gray(`   Debug: API URL: ${apiUrl}`));
        const cwd = process.cwd();
        const packagePath = path_1.default.join(cwd, 'package.json');
        if (!(0, fs_1.existsSync)(packagePath)) {
            spinner.fail(chalk_1.default.red('Not in a project directory'));
            console.log(chalk_1.default.yellow('Navigate to your project directory first'));
            console.log(chalk_1.default.yellow('Or run: mz init <project-name> to create a new project'));
            return;
        }
        const packageJson = await fs_extra_1.default.readJson(packagePath);
        const projectName = packageJson.name || path_1.default.basename(cwd);
        const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        spinner.text = `Preparing ${projectName} for deployment...`;
        const buildDir = options.buildDir || '.next';
        const buildPath = path_1.default.join(cwd, buildDir);
        if (!(0, fs_1.existsSync)(buildPath) && options.build !== false) {
            spinner.text = 'Building project...';
            try {
                const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
                if (packageJson.scripts?.build) {
                    execSync('npm run build', { stdio: 'inherit', cwd });
                    spinner.succeed(chalk_1.default.green('Build completed'));
                    spinner.start('Creating deployment package...');
                }
                else if (packageJson.scripts?.['build:prod']) {
                    execSync('npm run build:prod', { stdio: 'inherit', cwd });
                    spinner.succeed(chalk_1.default.green('Build completed'));
                    spinner.start('Creating deployment package...');
                }
                else {
                    spinner.warn(chalk_1.default.yellow('No build script found, skipping build'));
                    spinner.start('Creating deployment package...');
                }
            }
            catch (buildError) {
                spinner.fail(chalk_1.default.red('Build failed'));
                console.error(chalk_1.default.red(buildError.message));
                const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
                const { continueDeploy } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'continueDeploy',
                        message: 'Continue deployment anyway?',
                        default: false
                    }
                ]);
                if (!continueDeploy) {
                    return;
                }
                spinner.start('Creating deployment package...');
            }
        }
        spinner.text = 'Creating deployment package...';
        console.log(chalk_1.default.gray(`   Debug: Creating package from: ${cwd}`));
        const zipBuffer = await createDeploymentPackage(cwd, buildDir);
        if (!zipBuffer || zipBuffer.length === 0) {
            spinner.fail(chalk_1.default.red('Failed to create deployment package'));
            console.log(chalk_1.default.yellow('No files to deploy. Make sure your project has content.'));
            return;
        }
        const environment = options.env || 'staging';
        const version = packageJson.version || '1.0.0';
        const deployDescription = options.description || packageJson.description || `Deployment of ${projectName}`;
        let appId = options.appId;
        let appName = projectName;
        let appSlug = projectSlug;
        const mgzonConfigPath = path_1.default.join(cwd, '.mgzon.json');
        if ((0, fs_1.existsSync)(mgzonConfigPath)) {
            try {
                const mgzonConfig = await fs_extra_1.default.readJson(mgzonConfigPath);
                appId = appId || mgzonConfig.appId;
                appName = mgzonConfig.name || appName;
                appSlug = mgzonConfig.slug || appSlug;
            }
            catch (error) {
                console.log(chalk_1.default.yellow('⚠️  Could not read .mgzon.json config'));
            }
        }
        if (!appId) {
            spinner.text = 'Looking for existing app...';
            try {
                const headers = await (0, auth_1.getAuthHeaders)();
                const appsResponse = await axios_1.default.get(await (0, auth_1.buildApiUrl)('/apps'), { headers });
                if (appsResponse.data.success && appsResponse.data.data?.apps) {
                    const apps = appsResponse.data.data.apps;
                    const existingApp = apps.find(app => app.name === appName ||
                        app.slug === appSlug ||
                        app.name.includes(projectName));
                    if (existingApp) {
                        appId = existingApp.id;
                        appName = existingApp.name;
                        appSlug = existingApp.slug;
                        spinner.succeed(chalk_1.default.green(`Found existing app: ${appName}`));
                    }
                    else {
                        spinner.text = 'No existing app found';
                    }
                }
            }
            catch (error) {
                spinner.text = 'Could not fetch apps list';
            }
            if (!appId && !options.autoApprove) {
                spinner.stop();
                const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
                const { action } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'action',
                        message: 'No app found. What would you like to do?',
                        choices: [
                            { name: 'Create new app', value: 'create' },
                            { name: 'Enter app ID manually', value: 'manual' },
                            { name: 'Cancel deployment', value: 'cancel' }
                        ],
                        default: 'create'
                    }
                ]);
                if (action === 'cancel') {
                    spinner.fail(chalk_1.default.yellow('Deployment cancelled'));
                    return;
                }
                if (action === 'manual') {
                    const { manualAppId } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'manualAppId',
                            message: 'Enter app ID:',
                            validate: (input) => input.length > 0 || 'App ID is required'
                        }
                    ]);
                    appId = manualAppId;
                }
                else if (action === 'create') {
                    const { appName: newAppName } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'appName',
                            message: 'App name:',
                            default: appName,
                            validate: (input) => input.length > 0 || 'App name is required'
                        }
                    ]);
                    spinner.start('Creating new app...');
                    try {
                        const headers = await (0, auth_1.getAuthHeaders)();
                        const createResponse = await axios_1.default.post(await (0, auth_1.buildApiUrl)('/apps'), {
                            name: newAppName,
                            description: deployDescription,
                            environment: environment,
                            targetAudience: 'DEVELOPER'
                        }, { headers });
                        if (createResponse.data.success) {
                            appId = createResponse.data.data._id || createResponse.data.data.id;
                            appName = newAppName;
                            spinner.succeed(chalk_1.default.green(`App created: ${appName}`));
                        }
                        else {
                            throw new Error(createResponse.data.error || 'Failed to create app');
                        }
                    }
                    catch (error) {
                        spinner.fail(chalk_1.default.red('Failed to create app'));
                        console.error(chalk_1.default.red(error.message));
                        return;
                    }
                }
                spinner.start('Continuing deployment...');
            }
        }
        if (!appId) {
            spinner.fail(chalk_1.default.red('App ID is required'));
            console.log(chalk_1.default.yellow('Please specify app ID with:'));
            console.log(chalk_1.default.cyan('  mz deploy --app-id=<id>'));
            console.log(chalk_1.default.cyan('  Or create .mgzon.json with appId field'));
            console.log(chalk_1.default.cyan('  Or create app first: mz apps --create <name>'));
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.cyan('\n' + '═'.repeat(60)));
        console.log(chalk_1.default.bold('📦 Deployment Summary'));
        console.log(chalk_1.default.cyan('═'.repeat(60)));
        console.log(chalk_1.default.green(`Project:    ${projectName}`));
        console.log(chalk_1.default.green(`App:        ${appName} (${appId.slice(0, 8)}...)`));
        console.log(chalk_1.default.green(`Version:    ${version}`));
        console.log(chalk_1.default.green(`Environment: ${environment}`));
        console.log(chalk_1.default.green(`Package size: ${Math.round(zipBuffer.length / 1024 / 1024 * 100) / 100} MB`));
        console.log(chalk_1.default.cyan('═'.repeat(60)));
        if (!options.autoApprove) {
            const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Proceed with deployment?',
                    default: false
                }
            ]);
            if (!confirm) {
                console.log(chalk_1.default.yellow('Deployment cancelled'));
                return;
            }
        }
        spinner.start('Uploading to MGZON...');
        spinner.text = 'Uploading deployment package...';
        const headers = await (0, auth_1.getAuthHeaders)();
        const formData = new FormData();
        const fileBlob = new Blob([zipBuffer], { type: 'application/zip' });
        formData.append('file', fileBlob, 'deployment.zip');
        formData.append('appId', appId);
        formData.append('appName', appName);
        formData.append('environment', environment);
        formData.append('version', version);
        formData.append('type', 'nextjs');
        const isNextJS = !!packageJson.dependencies?.next || !!packageJson.devDependencies?.next;
        const isReact = !!packageJson.dependencies?.react;
        if (isNextJS) {
            formData.append('framework', 'nextjs');
            formData.append('buildCommand', packageJson.scripts?.build || 'next build');
        }
        else if (isReact) {
            formData.append('framework', 'react');
            formData.append('buildCommand', packageJson.scripts?.build || 'react-scripts build');
        }
        else {
            formData.append('framework', 'static');
        }
        if (deployDescription) {
            formData.append('description', deployDescription);
        }
        if (packageJson.repository?.url) {
            formData.append('repositoryUrl', packageJson.repository.url);
        }
        if (options.buildCommand) {
            formData.append('buildCommand', options.buildCommand);
        }
        if (options.installCommand) {
            formData.append('installCommand', options.installCommand);
        }
        if (options.outputDirectory) {
            formData.append('outputDirectory', options.outputDirectory);
        }
        const deployUrl = await (0, auth_1.buildApiUrl)('/deploy');
        console.log(chalk_1.default.gray(`   Debug: Deploy URL: ${deployUrl}`));
        spinner.text = 'Deploying...';
        try {
            const response = await axios_1.default.post(deployUrl, formData, {
                headers: {
                    'Authorization': headers.Authorization,
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 300000
            });
            if (!response.data.success) {
                throw new Error(response.data.error || response.data.message || 'Deployment failed');
            }
            const deployData = response.data.data;
            spinner.succeed(chalk_1.default.green('✅ Deployment successful!'));
            console.log(chalk_1.default.cyan('\n' + '═'.repeat(60)));
            console.log(chalk_1.default.bold('🚀 Deployment Complete'));
            console.log(chalk_1.default.cyan('═'.repeat(60)));
            console.log(chalk_1.default.green(`Deployment ID: ${deployData.deploymentId}`));
            console.log(chalk_1.default.green(`App: ${deployData.appName}`));
            console.log(chalk_1.default.green(`Version: ${deployData.version}`));
            console.log(chalk_1.default.green(`Environment: ${deployData.environment}`));
            console.log(chalk_1.default.green(`Status: ${deployData.status}`));
            if (deployData.url) {
                console.log(chalk_1.default.green(`URL: ${deployData.url}`));
            }
            console.log(chalk_1.default.cyan('═'.repeat(60)));
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
            console.log(chalk_1.default.cyan('\n' + '═'.repeat(60)));
            console.log(chalk_1.default.cyan('🔧 Useful Commands:'));
            console.log(chalk_1.default.yellow(`  mz apps --info ${deployData.appId}`));
            console.log(chalk_1.default.yellow(`  mz apps --logs ${deployData.appId}`));
            if (deployData.downloadUrl) {
                console.log(chalk_1.default.yellow(`  curl -O ${deployData.downloadUrl}`));
            }
            console.log(chalk_1.default.cyan('\n' + '═'.repeat(60) + '\n'));
        }
        catch (uploadError) {
            throw uploadError;
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Deployment failed'));
        console.log(chalk_1.default.red('\n' + '─'.repeat(50)));
        if (error.response) {
            const errorData = error.response.data;
            console.error(chalk_1.default.red(`Status: ${error.response.status}`));
            if (errorData?.error) {
                console.error(chalk_1.default.red(`Error: ${errorData.error}`));
            }
            if (errorData?.message) {
                console.error(chalk_1.default.red(`Message: ${errorData.message}`));
            }
            if (errorData?.details) {
                console.error(chalk_1.default.red(`Details: ${errorData.details}`));
            }
            console.log(chalk_1.default.gray(`URL: ${error.config?.url || 'Unknown'}`));
        }
        else if (error.code === 'ECONNREFUSED') {
            console.error(chalk_1.default.red('Cannot connect to MGZON API'));
            console.log(chalk_1.default.yellow('Make sure the server is running at:'));
            console.log(chalk_1.default.cyan(`  ${await (0, config_1.getApiUrl)()}`));
            console.log(chalk_1.default.yellow('\nTry:'));
            console.log(chalk_1.default.cyan('  mz config --set apiUrl=http://localhost:3000/api/v1'));
        }
        else if (error.code === 'ETIMEDOUT') {
            console.error(chalk_1.default.red('Request timed out'));
            console.log(chalk_1.default.yellow('The server is taking too long to respond'));
        }
        else {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            if (error.stack && process.env.DEBUG) {
                console.error(chalk_1.default.gray(error.stack));
            }
        }
        console.log(chalk_1.default.red('─'.repeat(50)));
        console.log(chalk_1.default.yellow('\n💡 Troubleshooting:'));
        console.log(chalk_1.default.cyan('  1. Check authentication: mz whoami'));
        console.log(chalk_1.default.cyan('  2. Check API URL: mz config --get apiUrl'));
        console.log(chalk_1.default.cyan('  3. Verify app exists: mz apps --list'));
        console.log(chalk_1.default.cyan('  4. Check network connection'));
        console.log(chalk_1.default.cyan('  5. Enable debug mode: DEBUG=1 mz deploy\n'));
    }
}
async function createDeploymentPackage(projectDir, buildDir) {
    console.log(chalk_1.default.gray(`   Debug: Creating deployment package from: ${projectDir}`));
    return new Promise((resolve, reject) => {
        const tempFile = path_1.default.join((0, os_1.tmpdir)(), `mgzon-deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.zip`);
        const output = (0, fs_1.createWriteStream)(tempFile);
        const archive = (0, archiver_1.default)('zip', {
            zlib: { level: 9 },
            comment: `MGZON Deployment - ${new Date().toISOString()}`
        });
        let totalSize = 0;
        let fileCount = 0;
        output.on('close', async () => {
            try {
                console.log(chalk_1.default.gray(`   Debug: Package created: ${totalSize} bytes, ${fileCount} files`));
                const buffer = await fs_extra_1.default.readFile(tempFile);
                await fs_extra_1.default.remove(tempFile);
                resolve(buffer);
            }
            catch (error) {
                reject(error);
            }
        });
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.log(chalk_1.default.yellow(`   Warning: ${err.message}`));
            }
            else {
                reject(err);
            }
        });
        archive.on('error', reject);
        archive.on('entry', (entry) => {
            fileCount++;
            if (entry.stats) {
                totalSize += entry.stats.size;
            }
        });
        archive.pipe(output);
        const buildPath = path_1.default.join(projectDir, buildDir);
        if ((0, fs_1.existsSync)(buildPath)) {
            archive.directory(buildPath, buildDir);
            console.log(chalk_1.default.gray(`   Debug: Added build directory: ${buildDir}`));
        }
        else {
            console.log(chalk_1.default.yellow(`   Warning: Build directory not found: ${buildDir}`));
        }
        const publicPath = path_1.default.join(projectDir, 'public');
        if ((0, fs_1.existsSync)(publicPath)) {
            archive.directory(publicPath, 'public');
            console.log(chalk_1.default.gray(`   Debug: Added public directory`));
        }
        const packagePath = path_1.default.join(projectDir, 'package.json');
        if ((0, fs_1.existsSync)(packagePath)) {
            archive.file(packagePath, { name: 'package.json' });
            console.log(chalk_1.default.gray(`   Debug: Added package.json`));
        }
        const mgzonConfigPath = path_1.default.join(projectDir, '.mgzon.json');
        if ((0, fs_1.existsSync)(mgzonConfigPath)) {
            archive.file(mgzonConfigPath, { name: '.mgzon.json' });
            console.log(chalk_1.default.gray(`   Debug: Added .mgzon.json`));
        }
        const readmePath = path_1.default.join(projectDir, 'README.md');
        if ((0, fs_1.existsSync)(readmePath)) {
            archive.file(readmePath, { name: 'README.md' });
        }
        const configFiles = [
            'next.config.js',
            'next.config.mjs',
            'next.config.ts',
            'vite.config.js',
            'vite.config.ts',
            'webpack.config.js',
            'rollup.config.js',
            '.env',
            '.env.local',
            '.env.production'
        ];
        configFiles.forEach(configFile => {
            const configPath = path_1.default.join(projectDir, configFile);
            if ((0, fs_1.existsSync)(configPath)) {
                archive.file(configPath, { name: configFile });
                console.log(chalk_1.default.gray(`   Debug: Added ${configFile}`));
            }
        });
        const nextStaticPath = path_1.default.join(projectDir, '.next', 'static');
        if ((0, fs_1.existsSync)(nextStaticPath)) {
            archive.directory(nextStaticPath, '.next/static');
            console.log(chalk_1.default.gray(`   Debug: Added .next/static directory`));
        }
        archive.finalize();
    });
}
//# sourceMappingURL=deploy.js.map