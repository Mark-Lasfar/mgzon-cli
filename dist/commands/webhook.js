"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookCommand = webhookCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const auth_1 = require("../middleware/auth");
const axios_1 = __importDefault(require("axios"));
const inquirer_1 = __importDefault(require("inquirer"));
async function webhookCommand(options) {
    const spinner = (0, ora_1.default)('Processing...').start();
    try {
        const headers = await (0, auth_1.getAuthHeaders)();
        if (options.list) {
            spinner.text = 'Fetching webhooks...';
            const response = await axios_1.default.get(await (0, auth_1.buildApiUrl)('/webhooks'), { headers });
            const webhooks = response.data.webhooks;
            spinner.succeed(chalk_1.default.green(`✅ Found ${webhooks.length} webhook(s)`));
            console.log(chalk_1.default.cyan('\n🔔 Your Webhooks\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            if (webhooks.length === 0) {
                console.log(chalk_1.default.yellow('No webhooks found. Create one with: mz webhook --create'));
                return;
            }
            webhooks.forEach((webhook, index) => {
                console.log(chalk_1.default.bold(`\n${index + 1}. ${webhook.url.substring(0, 50)}...`));
                console.log(chalk_1.default.gray(`   ID: ${webhook.id}`));
                console.log(chalk_1.default.gray(`   Status: ${webhook.status}`));
                console.log(chalk_1.default.gray(`   Events: ${webhook.events.join(', ')}`));
                console.log(chalk_1.default.gray(`   Created: ${new Date(webhook.createdAt).toLocaleDateString()}`));
                if (webhook.lastTriggered) {
                    console.log(chalk_1.default.gray(`   Last triggered: ${new Date(webhook.lastTriggered).toLocaleDateString()}`));
                }
                console.log(chalk_1.default.gray('   ' + '─'.repeat(40)));
            });
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
                        'order.created',
                        'order.updated',
                        'order.cancelled',
                        'product.created',
                        'product.updated',
                        'payment.succeeded',
                        'payment.failed',
                        'customer.created',
                        'customer.updated'
                    ],
                    default: ['order.created', 'payment.succeeded']
                }
            ]);
            spinner.start('Creating webhook...');
            const response = await axios_1.default.post(await (0, auth_1.buildApiUrl)('/webhooks'), {
                url: answers.url,
                events: answers.events
            }, { headers });
            const newWebhook = response.data.webhook;
            spinner.succeed(chalk_1.default.green('✅ Webhook created successfully!'));
            console.log(chalk_1.default.cyan('\n🔔 Webhook Details\n'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(`ID:     ${newWebhook.id}`));
            console.log(chalk_1.default.green(`URL:    ${newWebhook.url}`));
            console.log(chalk_1.default.green(`Status: ${newWebhook.status}`));
            console.log(chalk_1.default.green(`Events: ${newWebhook.events.join(', ')}`));
            console.log(chalk_1.default.yellow('\n📝 You can test this webhook with:'));
            console.log(chalk_1.default.cyan(`   mz webhook --simulate ${newWebhook.events[0]}\n`));
            return;
        }
        if (options.simulate) {
            spinner.text = 'Simulating webhook event...';
            const event = options.simulate;
            const validEvents = [
                'order.created', 'order.updated', 'order.cancelled',
                'product.created', 'product.updated',
                'payment.succeeded', 'payment.failed',
                'customer.created', 'customer.updated'
            ];
            if (!validEvents.includes(event)) {
                throw new Error(`Invalid event. Valid events: ${validEvents.join(', ')}`);
            }
            spinner.succeed(chalk_1.default.green(`✅ Simulating ${event}`));
            console.log(chalk_1.default.cyan('\n🔔 Webhook Simulation\n'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(`Event: ${event}`));
            console.log(chalk_1.default.green(`Time:  ${new Date().toISOString()}`));
            const examplePayload = {
                event: event,
                data: event.includes('order') ? {
                    id: 'ord_123456',
                    amount: 99.99,
                    currency: 'USD',
                    customer: { email: 'customer@example.com' }
                } : event.includes('product') ? {
                    id: 'prod_123456',
                    name: 'Sample Product',
                    price: 49.99
                } : event.includes('payment') ? {
                    id: 'pay_123456',
                    status: event.includes('succeeded') ? 'succeeded' : 'failed',
                    amount: 99.99
                } : {
                    id: 'cust_123456',
                    email: 'new@example.com'
                },
                created: new Date().toISOString()
            };
            console.log(chalk_1.default.green('\n📦 Example Payload:'));
            console.log(chalk_1.default.gray(JSON.stringify(examplePayload, null, 2)));
            console.log(chalk_1.default.yellow('\n💡 Tip: Use --webhook-url in mz serve to test locally'));
            console.log(chalk_1.default.cyan('   mz serve --webhook-url=http://localhost:3000/api/webhooks\n'));
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.cyan('\n🔔 Webhook Management\n'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('Usage:'));
        console.log(chalk_1.default.yellow('  mz webhook --list                 ') + chalk_1.default.gray('# List all webhooks'));
        console.log(chalk_1.default.yellow('  mz webhook --create               ') + chalk_1.default.gray('# Create new webhook'));
        console.log(chalk_1.default.yellow('  mz webhook --simulate <event>     ') + chalk_1.default.gray('# Simulate webhook event'));
        console.log(chalk_1.default.yellow('  mz webhook --delete <id>          ') + chalk_1.default.gray('# Delete webhook'));
        console.log(chalk_1.default.yellow('  mz webhook --url <url>            ') + chalk_1.default.gray('# Set webhook URL'));
        console.log(chalk_1.default.yellow('  mz webhook --events <events>      ') + chalk_1.default.gray('# Set events (comma separated)\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Webhook command failed'));
        if (error.response) {
            console.error(chalk_1.default.red(`  Error ${error.response.status}: ${error.response.data.message || 'API error'}`));
        }
        else {
            console.error(chalk_1.default.red(`  Error: ${error.message}`));
        }
    }
}
//# sourceMappingURL=webhook.js.map