"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appsCommand = appsCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const auth_1 = require("../middleware/auth");
const axios_1 = __importDefault(require("axios"));
const inquirer_1 = __importDefault(require("inquirer"));
async function appsCommand(options) {
    const spinner = (0, ora_1.default)('Processing...').start();
    try {
        const headers = await (0, auth_1.getAuthHeaders)();
        if (options.list) {
            spinner.text = 'Fetching your apps...';
            const apiUrl = await (0, auth_1.buildApiUrl)('/apps');
            console.log(chalk_1.default.gray(`   Debug: Fetching apps from: ${apiUrl}`));
            const response = await axios_1.default.get(apiUrl, { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch apps');
            }
            const apps = response.data.data.apps;
            spinner.succeed(chalk_1.default.green(`✅ Found ${apps.length} app(s)`));
            console.log(chalk_1.default.cyan('\n📱 Your Apps\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            if (apps.length === 0) {
                console.log(chalk_1.default.yellow('No apps found. Create one with: mz apps --create <name>'));
                console.log(chalk_1.default.gray('Or deploy an existing project with: mz deploy'));
                return;
            }
            apps.forEach((app, index) => {
                const statusColors = {
                    approved: chalk_1.default.green,
                    pending: chalk_1.default.yellow,
                    draft: chalk_1.default.blue,
                    rejected: chalk_1.default.red,
                    suspended: chalk_1.default.gray
                };
                console.log(chalk_1.default.bold(`\n${index + 1}. ${app.name}`));
                console.log(chalk_1.default.gray(`   ID: ${app._id}`));
                console.log(chalk_1.default.gray(`   Slug: ${app.slug}`));
                console.log(chalk_1.default.gray(`   Description: ${app.description || 'No description'}`));
                console.log(statusColors[app.status](`   Status: ${app.status.toUpperCase()}`));
                console.log(chalk_1.default.gray(`   Environment: ${app.environment}`));
                console.log(chalk_1.default.gray(`   Type: ${app.targetAudience}${app.isMarketplaceApp ? ' (Marketplace)' : ''}`));
                console.log(chalk_1.default.gray(`   Version: ${app.version}`));
                console.log(chalk_1.default.gray(`   Created: ${new Date(app.createdAt).toLocaleDateString()}`));
                if (app.domain) {
                    console.log(chalk_1.default.gray(`   Domain: ${app.domain}`));
                }
                console.log(chalk_1.default.gray('   ' + '─'.repeat(40)));
            });
            console.log(chalk_1.default.cyan('\n📊 Stats:'));
            console.log(chalk_1.default.gray(`   Total: ${response.data.data.pagination?.total || apps.length}`));
            console.log(chalk_1.default.gray(`   Marketplace: ${response.data.data.stats?.marketplace || 0}`));
            console.log(chalk_1.default.gray(`   Private: ${response.data.data.stats?.private || 0}`));
            return;
        }
        if (options.create) {
            const appName = options.create;
            if (!appName || appName.length < 3) {
                throw new Error('App name must be at least 3 characters');
            }
            spinner.stop();
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'targetAudience',
                    message: 'Target audience:',
                    choices: [
                        { name: 'Developers (Private app)', value: 'DEVELOPER' },
                        { name: 'Sellers (Marketplace app)', value: 'SELLER' },
                        { name: 'Both', value: 'BOTH' }
                    ],
                    default: 'DEVELOPER'
                },
                {
                    type: 'confirm',
                    name: 'isMarketplaceApp',
                    message: 'Publish to marketplace?',
                    default: false,
                    when: (answers) => answers.targetAudience !== 'DEVELOPER'
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'App description:',
                    default: `My MGZON app: ${appName}`
                },
                {
                    type: 'list',
                    name: 'environment',
                    message: 'Environment:',
                    choices: [
                        { name: 'Development', value: 'development' },
                        { name: 'Staging', value: 'staging' },
                        { name: 'Production', value: 'production' }
                    ],
                    default: 'staging'
                }
            ]);
            spinner.start('Creating app...');
            const apiUrl = await (0, auth_1.buildApiUrl)('/apps');
            console.log(chalk_1.default.gray(`   Debug: Creating app at: ${apiUrl}`));
            const response = await axios_1.default.post(apiUrl, {
                name: appName,
                description: answers.description,
                targetAudience: answers.targetAudience,
                isMarketplaceApp: answers.isMarketplaceApp || false,
                environment: answers.environment
            }, { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to create app');
            }
            const newApp = response.data.data;
            spinner.succeed(chalk_1.default.green(`✅ App "${newApp.name}" created successfully!`));
            console.log(chalk_1.default.cyan('\n📱 App Details\n'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(`ID:          ${newApp._id}`));
            console.log(chalk_1.default.green(`Name:        ${newApp.name}`));
            console.log(chalk_1.default.green(`Slug:        ${newApp.slug}`));
            console.log(chalk_1.default.green(`Status:      ${newApp.status}`));
            console.log(chalk_1.default.green(`Environment: ${newApp.environment}`));
            console.log(chalk_1.default.green(`Type:        ${newApp.targetAudience}`));
            console.log(chalk_1.default.green(`Created:     ${new Date(newApp.createdAt).toLocaleString()}`));
            if (response.data.credentials) {
                console.log(chalk_1.default.red('\n⚠️  IMPORTANT CREDENTIALS:'));
                console.log(chalk_1.default.green(`Client ID:     ${response.data.credentials.clientId}`));
                console.log(chalk_1.default.green(`Client Secret: ${response.data.credentials.clientSecret}`));
                console.log(chalk_1.default.red('Save these now - the secret won\'t be shown again!'));
            }
            console.log(chalk_1.default.yellow('\n🚀 Next steps:'));
            console.log(chalk_1.default.cyan('   1. Navigate to your project directory'));
            console.log(chalk_1.default.cyan('   2. Run: mz deploy'));
            console.log(chalk_1.default.cyan('   3. Your app will be deployed to MGZON\n'));
            return;
        }
        if (options.info) {
            const appId = options.info;
            spinner.text = 'Fetching app details...';
            const apiUrl = await (0, auth_1.buildApiUrl)(`/apps/${appId}`);
            console.log(chalk_1.default.gray(`   Debug: Fetching app details from: ${apiUrl}`));
            const response = await axios_1.default.get(apiUrl, { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch app details');
            }
            const app = response.data.data;
            spinner.succeed(chalk_1.default.green(`✅ App details for "${app.name}"`));
            console.log(chalk_1.default.cyan('\n📱 App Details\n'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(`ID:          ${app._id}`));
            console.log(chalk_1.default.green(`Name:        ${app.name}`));
            console.log(chalk_1.default.green(`Slug:        ${app.slug}`));
            console.log(chalk_1.default.green(`Description: ${app.description || 'No description'}`));
            console.log(chalk_1.default.green(`Status:      ${app.status}`));
            console.log(chalk_1.default.green(`Environment: ${app.environment}`));
            console.log(chalk_1.default.green(`Type:        ${app.targetAudience}`));
            console.log(chalk_1.default.green(`Marketplace: ${app.isMarketplaceApp ? 'Yes' : 'No'}`));
            console.log(chalk_1.default.green(`Version:     ${app.version}`));
            console.log(chalk_1.default.green(`Installs:    ${app.installs || 0}`));
            console.log(chalk_1.default.green(`Rating:      ${app.rating || 'No ratings'}`));
            console.log(chalk_1.default.green(`Created:     ${new Date(app.createdAt).toLocaleString()}`));
            console.log(chalk_1.default.green(`Updated:     ${new Date(app.updatedAt).toLocaleString()}`));
            if (app.domain) {
                console.log(chalk_1.default.green('\n🌐 Domain:'));
                console.log(chalk_1.default.cyan(`   ${app.domain}`));
            }
            if (app.domains && app.domains.length > 0) {
                console.log(chalk_1.default.green('\n🌐 Domains:'));
                app.domains.forEach(domain => {
                    console.log(chalk_1.default.cyan(`   - ${domain.domain} (${domain.type})`));
                });
            }
            console.log(chalk_1.default.yellow('\n🔗 App URLs:'));
            console.log(chalk_1.default.cyan(`   API Endpoint: ${await (0, auth_1.buildApiUrl)(`/apps/${app._id}`)}`));
            if (app.domain) {
                console.log(chalk_1.default.cyan(`   Live URL: https://${app.domain}`));
            }
            else if (app.slug) {
                console.log(chalk_1.default.cyan(`   Development URL: https://${app.slug}.dev.mgzon.app`));
            }
            return;
        }
        if (options.delete) {
            const appId = options.delete;
            spinner.text = 'Checking app...';
            const apiUrl = await (0, auth_1.buildApiUrl)(`/apps/${appId}`);
            console.log(chalk_1.default.gray(`   Debug: Checking app at: ${apiUrl}`));
            const appResponse = await axios_1.default.get(apiUrl, { headers });
            if (!appResponse.data.success) {
                throw new Error('App not found');
            }
            const app = appResponse.data.data;
            spinner.stop();
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Are you sure you want to delete app "${app.name}" (${app.slug})? This cannot be undone.`,
                    default: false
                }
            ]);
            if (!confirm) {
                spinner.fail(chalk_1.default.yellow('Deletion cancelled'));
                return;
            }
            spinner.start('Deleting app...');
            console.log(chalk_1.default.gray(`   Debug: Deleting app at: ${apiUrl}`));
            const deleteResponse = await axios_1.default.delete(apiUrl, { headers });
            if (!deleteResponse.data.success) {
                throw new Error(deleteResponse.data.error || 'Failed to delete app');
            }
            spinner.succeed(chalk_1.default.green(`✅ App "${app.name}" deleted successfully`));
            return;
        }
        if (options.domains) {
            const appId = options.domains === true ? undefined : options.domains;
            if (!appId) {
                throw new Error('App ID required for domains command');
            }
            spinner.text = 'Fetching app domains...';
            const apiUrl = await (0, auth_1.buildApiUrl)(`/apps/${appId}/domains`);
            console.log(chalk_1.default.gray(`   Debug: Fetching domains from: ${apiUrl}`));
            const response = await axios_1.default.get(apiUrl, { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch domains');
            }
            const domains = response.data.data.domains;
            spinner.succeed(chalk_1.default.green(`✅ Found ${domains.length} domain(s)`));
            console.log(chalk_1.default.cyan('\n🌐 App Domains\n'));
            console.log(chalk_1.default.gray('─'.repeat(60)));
            if (domains.length === 0) {
                console.log(chalk_1.default.yellow('No domains found. Add one with:'));
                console.log(chalk_1.default.cyan(`  curl -X POST ${await (0, auth_1.buildApiUrl)(`/apps/${appId}/domains`)} \\`));
                console.log(chalk_1.default.cyan(`    -H "Authorization: Bearer YOUR_API_KEY" \\`));
                console.log(chalk_1.default.cyan(`    -H "Content-Type: application/json" \\`));
                console.log(chalk_1.default.cyan(`    -d '{"domain": "your-domain.com"}'`));
                return;
            }
            domains.forEach((domain, index) => {
                console.log(chalk_1.default.bold(`\n${index + 1}. ${domain.domain}`));
                console.log(chalk_1.default.gray(`   Type: ${domain.type}`));
                console.log(chalk_1.default.gray(`   SSL: ${domain.sslStatus || 'Unknown'}`));
                console.log(chalk_1.default.gray(`   Verified: ${domain.verified ? '✅' : '❌'}`));
                console.log(chalk_1.default.gray(`   Created: ${new Date(domain.createdAt).toLocaleDateString()}`));
                console.log(chalk_1.default.gray('   ' + '─'.repeat(40)));
            });
            return;
        }
        if (options.logs) {
            const appId = options.logs === true ? undefined : options.logs;
            if (!appId) {
                throw new Error('App ID required for logs command');
            }
            spinner.text = 'Fetching app logs...';
            const apiUrl = await (0, auth_1.buildApiUrl)(`/apps/${appId}/logs`);
            console.log(chalk_1.default.gray(`   Debug: Fetching logs from: ${apiUrl}`));
            const response = await axios_1.default.get(apiUrl, { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch logs');
            }
            const logs = response.data.data.logs;
            const stats = response.data.data.stats;
            spinner.succeed(chalk_1.default.green(`✅ Found ${logs.length} log(s)`));
            console.log(chalk_1.default.cyan('\n📋 App Logs\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            if (logs.length === 0) {
                console.log(chalk_1.default.yellow('No logs found.'));
                return;
            }
            logs.forEach((log, index) => {
                const levelColors = {
                    info: chalk_1.default.blue,
                    warn: chalk_1.default.yellow,
                    error: chalk_1.default.red
                };
                console.log(levelColors[log.level](`\n${index + 1}. [${log.level.toUpperCase()}]`));
                console.log(chalk_1.default.gray(`   Time: ${new Date(log.timestamp).toLocaleString()}`));
                console.log(chalk_1.default.gray(`   Message: ${log.message}`));
                if (log.source) {
                    console.log(chalk_1.default.gray(`   Source: ${log.source}`));
                }
                if (log.metadata) {
                    console.log(chalk_1.default.gray(`   Metadata: ${JSON.stringify(log.metadata, null, 2)}`));
                }
                console.log(chalk_1.default.gray('   ' + '─'.repeat(40)));
            });
            console.log(chalk_1.default.cyan('\n📊 Log Statistics:'));
            console.log(chalk_1.default.gray(`   Total: ${stats.total}`));
            console.log(chalk_1.default.gray(`   Info: ${stats.byLevel?.info || 0}`));
            console.log(chalk_1.default.gray(`   Warnings: ${stats.byLevel?.warn || 0}`));
            console.log(chalk_1.default.gray(`   Errors: ${stats.byLevel?.error || 0}`));
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.cyan('\n📱 Apps Management\n'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('Usage:'));
        console.log(chalk_1.default.yellow('  mz apps --list                    ') + chalk_1.default.gray('# List all apps'));
        console.log(chalk_1.default.yellow('  mz apps --create <name>           ') + chalk_1.default.gray('# Create new app'));
        console.log(chalk_1.default.yellow('  mz apps --info <app-id>           ') + chalk_1.default.gray('# Show app details'));
        console.log(chalk_1.default.yellow('  mz apps --delete <app-id>         ') + chalk_1.default.gray('# Delete an app'));
        console.log(chalk_1.default.yellow('  mz apps --domains <app-id>        ') + chalk_1.default.gray('# List app domains'));
        console.log(chalk_1.default.yellow('  mz apps --logs <app-id>           ') + chalk_1.default.gray('# View app logs\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Apps command failed'));
        if (error.response) {
            const errorData = error.response.data;
            console.error(chalk_1.default.red(`  Error ${error.response.status}: ${errorData?.error || errorData?.message || 'API error'}`));
            if (errorData?.suggestion) {
                console.error(chalk_1.default.yellow(`  Suggestion: ${errorData.suggestion}`));
            }
        }
        else {
            console.error(chalk_1.default.red(`  Error: ${error.message}`));
        }
        console.log(chalk_1.default.gray('\n🔧 Debug Info:'));
        console.log(chalk_1.default.cyan('   Try: mz config --get apiUrl'));
        console.log(chalk_1.default.cyan('   Current API URL: ' + (await (0, auth_1.buildApiUrl)('/test').catch(() => 'Unknown'))));
    }
}
//# sourceMappingURL=apps.js.map