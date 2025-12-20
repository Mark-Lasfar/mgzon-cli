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
exports.webhookCommand = webhookCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const axios_1 = __importDefault(require("axios"));
const inquirer_1 = __importDefault(require("inquirer"));
const auth_1 = require("../middleware/auth");
async function webhookCommand(options) {
    const spinner = (0, ora_1.default)('Processing...').start();
    try {
        const headers = await (0, auth_1.getAuthHeaders)();
        if (options.list) {
            spinner.text = 'Fetching webhooks...';
            const params = {
                limit: options.limit || 50,
                skip: options.skip || 0
            };
            if (options.provider)
                params.provider = options.provider;
            if (options.status)
                params.status = options.status;
            if (options.type)
                params.type = options.type;
            if (options.appId)
                params.appId = options.appId;
            const webhookEndpoint = '/api/v1/webhooks';
            console.log(chalk_1.default.gray(`   Debug: Fetching from endpoint: ${webhookEndpoint}`));
            const response = await axios_1.default.get(await (0, auth_1.buildApiUrl)(webhookEndpoint), {
                headers,
                params
            });
            const webhooks = response.data.data || [];
            spinner.succeed(chalk_1.default.green(`✅ Found ${webhooks.length} webhook(s)`));
            const systemWebhooks = webhooks.filter(w => w.type === 'system' || !w.type);
            const developerWebhooks = webhooks.filter(w => w.type === 'developer');
            console.log(chalk_1.default.cyan('\n🔔 Your Webhooks\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            if (systemWebhooks.length > 0) {
                console.log(chalk_1.default.bold('\n📦 System Webhooks:'));
                systemWebhooks.forEach((webhook, index) => {
                    const statusColor = webhook.status === 'active' ? chalk_1.default.green :
                        webhook.status === 'failed' ? chalk_1.default.red : chalk_1.default.yellow;
                    console.log(chalk_1.default.bold(`\n${index + 1}. ${webhook.url.substring(0, 60)}...`));
                    console.log(chalk_1.default.gray(`   ID: ${webhook._id || webhook.id}`));
                    console.log(chalk_1.default.gray(`   Status: ${statusColor(webhook.status)}`));
                    console.log(chalk_1.default.gray(`   Provider: ${webhook.provider || 'System'}`));
                    console.log(chalk_1.default.gray(`   Events: ${webhook.events.join(', ')}`));
                    console.log(chalk_1.default.gray(`   Created: ${new Date(webhook.createdAt).toLocaleDateString()}`));
                    if (webhook.lastTriggered) {
                        console.log(chalk_1.default.gray(`   Last triggered: ${new Date(webhook.lastTriggered).toLocaleDateString()}`));
                    }
                    if (webhook.retryCount && webhook.retryCount > 0) {
                        console.log(chalk_1.default.yellow(`   Retry count: ${webhook.retryCount}`));
                    }
                    console.log(chalk_1.default.gray('   ' + '─'.repeat(40)));
                });
            }
            if (developerWebhooks.length > 0) {
                console.log(chalk_1.default.bold('\n👨‍💻 Developer Webhooks:'));
                developerWebhooks.forEach((webhook, index) => {
                    const statusColor = webhook.status === 'active' ? chalk_1.default.green :
                        webhook.status === 'failed' ? chalk_1.default.red : chalk_1.default.yellow;
                    console.log(chalk_1.default.bold(`\n${index + 1}. ${webhook.name || 'Developer Webhook'}`));
                    console.log(chalk_1.default.gray(`   ID: ${webhook._id || webhook.id}`));
                    console.log(chalk_1.default.gray(`   URL: ${webhook.url.substring(0, 50)}...`));
                    console.log(chalk_1.default.gray(`   Status: ${statusColor(webhook.status)}`));
                    console.log(chalk_1.default.gray(`   App ID: ${webhook.appId || 'N/A'}`));
                    console.log(chalk_1.default.gray(`   Events: ${webhook.events.join(', ')}`));
                    console.log(chalk_1.default.gray(`   Created: ${new Date(webhook.createdAt).toLocaleDateString()}`));
                    if (webhook.description) {
                        console.log(chalk_1.default.gray(`   Description: ${webhook.description.substring(0, 100)}...`));
                    }
                    console.log(chalk_1.default.gray('   ' + '─'.repeat(40)));
                });
            }
            if (webhooks.length === 0) {
                console.log(chalk_1.default.yellow('No webhooks found.'));
                console.log(chalk_1.default.gray('For system webhooks: mz webhook --create'));
                console.log(chalk_1.default.gray('For developer webhooks: mz webhook --create-dev --app-id=<app-id>'));
                return;
            }
            if (response.data.stats) {
                console.log(chalk_1.default.cyan('\n📊 Webhook Statistics:'));
                console.log(chalk_1.default.gray(`   Total: ${response.data.stats.totalWebhooks || 0}`));
                console.log(chalk_1.default.gray(`   Successful: ${response.data.stats.successfulWebhooks || 0}`));
                console.log(chalk_1.default.gray(`   Failed: ${response.data.stats.failedWebhooks || 0}`));
                console.log(chalk_1.default.gray(`   Last 24h: ${response.data.stats.last24Hours || 0}`));
            }
            if (response.data.pagination?.hasMore) {
                console.log(chalk_1.default.cyan(`\n📄 Showing ${webhooks.length} of ${response.data.pagination.total} webhooks`));
                console.log(chalk_1.default.gray('Use --skip and --limit for pagination'));
            }
            return;
        }
        if (options['create-dev']) {
            spinner.stop();
            try {
                const appsEndpoint = '/api/v1/apps';
                const appsRes = await axios_1.default.get(await (0, auth_1.buildApiUrl)(appsEndpoint), { headers });
                const apps = appsRes.data.data?.apps || [];
                const developerApps = apps.filter((app) => app.targetAudience === 'DEVELOPER' || app.isMarketplaceApp);
                if (developerApps.length === 0) {
                    console.log(chalk_1.default.yellow('No developer apps found. Create one first:'));
                    console.log(chalk_1.default.cyan('  mz apps --create <app-name>'));
                    return;
                }
                const answers = await inquirer_1.default.prompt([
                    {
                        type: 'list',
                        name: 'appId',
                        message: 'Select developer app:',
                        choices: developerApps.map((app) => ({
                            name: `${app.name} (${app.slug})`,
                            value: app._id
                        }))
                    },
                    {
                        type: 'input',
                        name: 'url',
                        message: 'Webhook URL:',
                        validate: (input) => {
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
                        name: 'name',
                        message: 'Webhook name:',
                        default: 'Developer Webhook'
                    },
                    {
                        type: 'input',
                        name: 'description',
                        message: 'Webhook description:',
                        default: 'Webhook for developer app'
                    },
                    {
                        type: 'checkbox',
                        name: 'events',
                        message: 'Select events to listen to:',
                        choices: [
                            'developer.app.installed',
                            'developer.app.uninstalled',
                            'developer.app.updated',
                            'order.created',
                            'order.updated',
                            'payment.succeeded',
                            'payment.failed',
                            'inventory.updated',
                            'product.created',
                            'product.updated',
                            'customer.created',
                            'customer.updated'
                        ],
                        default: ['developer.app.installed', 'order.created']
                    }
                ]);
                spinner.start('Creating developer webhook...');
                const createEndpoint = '/api/v1/webhooks';
                console.log(chalk_1.default.gray(`   Debug: Creating webhook at: ${createEndpoint}`));
                const response = await axios_1.default.put(await (0, auth_1.buildApiUrl)(createEndpoint), {
                    url: answers.url,
                    events: answers.events,
                    name: answers.name,
                    description: answers.description,
                    appId: answers.appId,
                    developerId: 'current'
                }, { headers });
                if (!response.data.success) {
                    throw new Error(response.data.error || 'Failed to create developer webhook');
                }
                const newWebhook = response.data.data;
                spinner.succeed(chalk_1.default.green('✅ Developer webhook created successfully!'));
                console.log(chalk_1.default.cyan('\n👨‍💻 Developer Webhook Details\n'));
                console.log(chalk_1.default.gray('─'.repeat(50)));
                console.log(chalk_1.default.green(`ID:          ${newWebhook.id}`));
                console.log(chalk_1.default.green(`Name:        ${answers.name}`));
                console.log(chalk_1.default.green(`URL:         ${answers.url}`));
                console.log(chalk_1.default.green(`App ID:      ${answers.appId}`));
                console.log(chalk_1.default.green(`Status:      active`));
                console.log(chalk_1.default.green(`Events:      ${answers.events.join(', ')}`));
                console.log(chalk_1.default.red('\n⚠️  IMPORTANT:'));
                console.log(chalk_1.default.green(`Webhook Secret: ${newWebhook.secret || 'Not shown'}`));
                console.log(chalk_1.default.red('Save this secret now - it will not be shown again!'));
                console.log(chalk_1.default.yellow('\n📝 How to use:'));
                console.log(chalk_1.default.cyan('  1. Configure your server to listen to the webhook URL'));
                console.log(chalk_1.default.cyan('  2. Verify signatures using the webhook secret'));
                console.log(chalk_1.default.cyan('  3. Test with: mz webhook --test-dev --event=developer.app.installed'));
            }
            catch (error) {
                throw new Error(`Failed to create developer webhook: ${error.message}`);
            }
            return;
        }
        if (options['test-dev']) {
            spinner.text = 'Testing developer webhook...';
            const appId = options['app-id'];
            const event = options.event || options['test-dev'];
            if (!appId) {
                spinner.fail(chalk_1.default.red('App ID is required for developer webhook testing'));
                console.log(chalk_1.default.yellow('Use: mz webhook --test-dev --event=<event> --app-id=<app-id>'));
                return;
            }
            const testData = {
                'developer.app.installed': {
                    appId: appId,
                    userId: 'test_user_123',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        installationId: 'install_' + Date.now(),
                        platform: 'web',
                        userAgent: 'Test Browser',
                        ip: '127.0.0.1'
                    }
                },
                'developer.app.uninstalled': {
                    appId: appId,
                    userId: 'test_user_123',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        reason: 'user_request',
                        uninstalledAt: new Date().toISOString()
                    }
                },
                'developer.app.updated': {
                    appId: appId,
                    userId: 'test_user_123',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        version: '2.0.0',
                        previousVersion: '1.0.0',
                        updateType: 'major',
                        changelog: ['Added new features', 'Fixed bugs']
                    }
                }
            };
            const payload = {
                provider: 'developer',
                event: event,
                data: testData[event] || {
                    message: 'Test developer webhook event',
                    appId,
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            };
            const appInfoEndpoint = `/api/v1/apps/${appId}`;
            const appResponse = await axios_1.default.get(await (0, auth_1.buildApiUrl)(appInfoEndpoint), { headers });
            const app = appResponse.data.data;
            const webhookUrl = app.webhook?.url || options.url;
            if (!webhookUrl) {
                spinner.stop();
                console.log(chalk_1.default.yellow(`\n⚠️  No webhook URL configured for app: ${app.name}`));
                console.log(chalk_1.default.cyan('\nExample payload:'));
                console.log(chalk_1.default.gray(JSON.stringify(payload, null, 2)));
                console.log(chalk_1.default.yellow('\n💡 To set up a webhook:'));
                console.log(chalk_1.default.cyan('  1. Run: mz webhook --create-dev --app-id=' + appId));
                console.log(chalk_1.default.cyan('  2. Configure your server to listen at the webhook URL'));
                console.log(chalk_1.default.cyan('  3. Test with this command again\n'));
                return;
            }
            try {
                const webhookSecret = app.webhook?.secret || 'test_secret';
                const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
                const hmac = crypto.createHmac('sha256', webhookSecret);
                const signature = hmac
                    .update(JSON.stringify(payload))
                    .digest('hex');
                const testHeaders = {
                    'Content-Type': 'application/json',
                    'x-developer-signature': signature,
                    'x-developer-app-id': appId,
                    'x-developer-api-key': options['api-key'] || 'test_key'
                };
                const response = await axios_1.default.post(webhookUrl, payload, {
                    headers: testHeaders,
                    timeout: 10000
                });
                spinner.succeed(chalk_1.default.green(`✅ Developer webhook test successful to ${webhookUrl}`));
                console.log(chalk_1.default.cyan('\n👨‍💻 Developer Webhook Test Results\n'));
                console.log(chalk_1.default.gray('─'.repeat(50)));
                console.log(chalk_1.default.green(`App:       ${app.name}`));
                console.log(chalk_1.default.green(`Event:     ${event}`));
                console.log(chalk_1.default.green(`URL:       ${webhookUrl}`));
                console.log(chalk_1.default.green(`Status:    ${response.status}`));
                console.log(chalk_1.default.green(`Time:      ${new Date().toISOString()}`));
                console.log(chalk_1.default.green('\n📦 Sent Payload:'));
                console.log(chalk_1.default.gray(JSON.stringify(payload, null, 2)));
                console.log(chalk_1.default.green('\n📥 Response:'));
                console.log(chalk_1.default.gray(JSON.stringify(response.data, null, 2)));
            }
            catch (error) {
                spinner.fail(chalk_1.default.red(`❌ Developer webhook test failed to ${webhookUrl}`));
                console.error(chalk_1.default.red(`Error: ${error.message}`));
                if (error.response) {
                    console.error(chalk_1.default.red(`Response: ${JSON.stringify(error.response.data, null, 2)}`));
                }
            }
            return;
        }
        if (options.create) {
            spinner.stop();
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'url',
                    message: 'Webhook URL:',
                    validate: (input) => {
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
                    type: 'checkbox',
                    name: 'events',
                    message: 'Select events to listen to:',
                    choices: [
                        'inventory.updated',
                        'order.created',
                        'order.updated',
                        'order.shipped',
                        'order.delivered',
                        'order.cancelled',
                        'payment.succeeded',
                        'payment.failed',
                        'product.created',
                        'product.updated',
                        'customer.created',
                        'customer.updated'
                    ],
                    default: ['order.created', 'inventory.updated']
                },
                {
                    type: 'input',
                    name: 'provider',
                    message: 'Provider (optional):',
                    default: 'custom'
                }
            ]);
            spinner.start('Creating webhook...');
            const createEndpoint = '/api/v1/webhooks';
            console.log(chalk_1.default.gray(`   Debug: Creating webhook at: ${createEndpoint}`));
            const response = await axios_1.default.post(await (0, auth_1.buildApiUrl)(createEndpoint), {
                url: answers.url,
                events: answers.events,
                provider: answers.provider
            }, { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to create webhook');
            }
            const newWebhook = response.data.data || response.data;
            spinner.succeed(chalk_1.default.green('✅ Webhook created successfully!'));
            console.log(chalk_1.default.cyan('\n🔔 Webhook Details\n'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(`ID:       ${newWebhook._id || newWebhook.id}`));
            console.log(chalk_1.default.green(`URL:      ${newWebhook.url}`));
            console.log(chalk_1.default.green(`Status:   ${newWebhook.status || 'active'}`));
            console.log(chalk_1.default.green(`Provider: ${newWebhook.provider || 'custom'}`));
            console.log(chalk_1.default.green(`Events:   ${newWebhook.events.join(', ')}`));
            console.log(chalk_1.default.yellow('\n📝 You can test this webhook with:'));
            console.log(chalk_1.default.cyan(`   mz webhook --test --event=${newWebhook.events[0] || 'order.created'}\n`));
            return;
        }
        if (options.test || options.simulate) {
            spinner.text = 'Testing webhook...';
            const provider = options.provider || 'custom';
            const event = options.event || options.test || options.simulate;
            const testData = {
                'inventory.updated': {
                    sku: 'TEST-SKU-001',
                    quantity: 100,
                    location: 'Warehouse A',
                    status: 'in_stock'
                },
                'order.created': {
                    orderId: 'TEST-ORDER-' + Date.now(),
                    status: 'pending',
                    totalAmount: 99.99,
                    currency: 'USD',
                    items: [
                        {
                            productId: 'prod_123',
                            name: 'Test Product',
                            sku: 'TEST-SKU-001',
                            price: 49.99,
                            quantity: 2,
                            currency: 'USD'
                        }
                    ],
                    shippingAddress: {
                        street: '123 Test St',
                        city: 'Test City',
                        country: 'US',
                        postalCode: '12345'
                    },
                    customer: {
                        name: 'Test Customer',
                        email: 'test@example.com'
                    }
                },
                'order.updated': {
                    orderId: 'TEST-ORDER-001',
                    status: 'processing',
                    trackingNumber: 'TRACK-' + Date.now(),
                    trackingUrl: 'https://tracking.example.com/TRACK-001'
                },
                'order.shipped': {
                    orderId: 'TEST-ORDER-001',
                    trackingNumber: 'TRACK-' + Date.now(),
                    trackingUrl: 'https://tracking.example.com/TRACK-001',
                    carrier: 'Test Carrier',
                    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                'order.delivered': {
                    orderId: 'TEST-ORDER-001',
                    deliveredAt: new Date().toISOString()
                },
                'order.cancelled': {
                    orderId: 'TEST-ORDER-001',
                    reason: 'Customer request',
                    cancelledAt: new Date().toISOString()
                }
            };
            const payload = {
                provider: provider,
                event: event,
                data: testData[event] || { message: 'Test webhook event' },
                timestamp: new Date().toISOString()
            };
            if (options.url) {
                try {
                    const response = await axios_1.default.post(options.url, payload);
                    spinner.succeed(chalk_1.default.green(`✅ Webhook test successful to ${options.url}`));
                    console.log(chalk_1.default.cyan('\n🔔 Webhook Test Results\n'));
                    console.log(chalk_1.default.gray('─'.repeat(50)));
                    console.log(chalk_1.default.green(`Status: ${response.status}`));
                    console.log(chalk_1.default.green(`Event:  ${event}`));
                    console.log(chalk_1.default.green(`Time:   ${new Date().toISOString()}`));
                    console.log(chalk_1.default.green('\n📦 Sent Payload:'));
                    console.log(chalk_1.default.gray(JSON.stringify(payload, null, 2)));
                    console.log(chalk_1.default.green('\n📥 Response:'));
                    console.log(chalk_1.default.gray(JSON.stringify(response.data, null, 2)));
                }
                catch (error) {
                    spinner.fail(chalk_1.default.red(`❌ Webhook test failed to ${options.url}`));
                    console.error(chalk_1.default.red(`Error: ${error.message}`));
                    if (error.response) {
                        console.error(chalk_1.default.red(`Response: ${JSON.stringify(error.response.data, null, 2)}`));
                    }
                }
            }
            else {
                spinner.succeed(chalk_1.default.green(`✅ Test payload generated for ${event}`));
                console.log(chalk_1.default.cyan('\n🔔 Webhook Test Example\n'));
                console.log(chalk_1.default.gray('─'.repeat(50)));
                console.log(chalk_1.default.green(`Event: ${event}`));
                console.log(chalk_1.default.green(`Time:  ${new Date().toISOString()}`));
                console.log(chalk_1.default.green('\n📦 Example Payload:'));
                console.log(chalk_1.default.gray(JSON.stringify(payload, null, 2)));
                console.log(chalk_1.default.yellow('\n💡 To test with actual URL:'));
                console.log(chalk_1.default.cyan(`   mz webhook --test --event=${event} --url=https://your-webhook-url.com\n`));
                console.log(chalk_1.default.cyan(`   OR use ngrok for local testing:`));
                console.log(chalk_1.default.cyan(`   ngrok http 3000`));
                console.log(chalk_1.default.cyan(`   mz webhook --test --event=${event} --url=https://your-ngrok-url.ngrok.io/api/v1/webhooks\n`));
            }
            return;
        }
        if (options.delete) {
            const webhookId = options.delete;
            spinner.text = `Deleting webhook ${webhookId}...`;
            const deleteEndpoint = `/api/v1/webhooks?id=${webhookId}`;
            console.log(chalk_1.default.gray(`   Debug: Deleting webhook at: ${deleteEndpoint}`));
            const response = await axios_1.default.delete(await (0, auth_1.buildApiUrl)(deleteEndpoint), { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to delete webhook');
            }
            spinner.succeed(chalk_1.default.green(`✅ Webhook deleted successfully`));
            console.log(chalk_1.default.green(`ID: ${webhookId}`));
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.cyan('\n🔔 Webhook Management CLI\n'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('\n👨‍💻 Developer Commands:'));
        console.log(chalk_1.default.yellow('  mz webhook --list --type=developer        ') + chalk_1.default.gray('# List developer webhooks'));
        console.log(chalk_1.default.yellow('  mz webhook --create-dev                   ') + chalk_1.default.gray('# Create developer webhook'));
        console.log(chalk_1.default.yellow('  mz webhook --test-dev --event=<event> --app-id=<id> ') + chalk_1.default.gray('# Test developer webhook'));
        console.log(chalk_1.default.yellow('  mz webhook --list --app-id=<app-id>       ') + chalk_1.default.gray('# List webhooks for specific app'));
        console.log(chalk_1.default.bold('\n🔧 System Commands:'));
        console.log(chalk_1.default.yellow('  mz webhook --list                          ') + chalk_1.default.gray('# List all webhooks'));
        console.log(chalk_1.default.yellow('  mz webhook --create                        ') + chalk_1.default.gray('# Create system webhook'));
        console.log(chalk_1.default.yellow('  mz webhook --test --event=<event>          ') + chalk_1.default.gray('# Test system webhook'));
        console.log(chalk_1.default.yellow('  mz webhook --delete <id>                   ') + chalk_1.default.gray('# Delete webhook'));
        console.log(chalk_1.default.bold('\n📊 Filtering:'));
        console.log(chalk_1.default.yellow('  --provider=<provider>                      ') + chalk_1.default.gray('# Filter by provider'));
        console.log(chalk_1.default.yellow('  --status=<status>                          ') + chalk_1.default.gray('# Filter by status'));
        console.log(chalk_1.default.yellow('  --type=<type>                              ') + chalk_1.default.gray('# system or developer'));
        console.log(chalk_1.default.yellow('  --app-id=<id>                              ') + chalk_1.default.gray('# Filter by app ID'));
        console.log(chalk_1.default.gray('\nExamples:'));
        console.log(chalk_1.default.cyan('  # إنشاء webhook عادي'));
        console.log(chalk_1.default.cyan('  mz webhook --create'));
        console.log(chalk_1.default.cyan('  # إنشاء webhook لتطبيق مطور'));
        console.log(chalk_1.default.cyan('  mz webhook --create-dev'));
        console.log(chalk_1.default.cyan('  # اختبار تثبيت تطبيق'));
        console.log(chalk_1.default.cyan('  mz webhook --test-dev --event="developer.app.installed" --app-id=123'));
        console.log(chalk_1.default.cyan('  # عرض جميع webhooks المطور'));
        console.log(chalk_1.default.cyan('  mz webhook --list --type=developer'));
        console.log(chalk_1.default.cyan('  # اختبار webhook محلي باستخدام ngrok'));
        console.log(chalk_1.default.cyan('  ngrok http 3000'));
        console.log(chalk_1.default.cyan('  mz webhook --test --event="order.created" --url=https://your-ngrok.ngrok.io/api/v1/webhooks\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Webhook command failed'));
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (axiosError.response) {
                console.error(chalk_1.default.red(`  Error ${axiosError.response.status}:`));
                if (axiosError.response.data) {
                    console.error(chalk_1.default.red(`  ${JSON.stringify(axiosError.response.data, null, 2)}`));
                }
            }
            else {
                console.error(chalk_1.default.red(`  Error: ${axiosError.message}`));
            }
            console.log(chalk_1.default.gray('\n🔧 Debug Info:'));
            console.log(chalk_1.default.cyan(`   Current API URL: ${await (async () => {
                try {
                    const { getApiUrl } = await Promise.resolve().then(() => __importStar(require('../utils/config')));
                    return await getApiUrl();
                }
                catch {
                    return 'Unknown';
                }
            })()}`));
        }
        else {
            console.error(chalk_1.default.red(`  Error: ${error.message}`));
        }
    }
}
