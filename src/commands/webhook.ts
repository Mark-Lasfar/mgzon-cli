import chalk from 'chalk';
import ora from 'ora';

import { buildApiUrl, getAuthHeaders } from '../middleware/auth';

import axios from 'axios';
import inquirer from 'inquirer';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  lastTriggered?: string;
}

export async function webhookCommand(options: any) {
  const spinner = ora('Processing...').start();

  try {
    const headers = await getAuthHeaders();

    if (options.list) {
      spinner.text = 'Fetching webhooks...';
      
      const response = await axios.get(await buildApiUrl('/webhooks'), { headers });

      const webhooks: Webhook[] = response.data.webhooks;
      
      spinner.succeed(chalk.green(`✅ Found ${webhooks.length} webhook(s)`));
      
      console.log(chalk.cyan('\n🔔 Your Webhooks\n'));
      console.log(chalk.gray('─'.repeat(80)));
      
      if (webhooks.length === 0) {
        console.log(chalk.yellow('No webhooks found. Create one with: mz webhook --create'));
        return;
      }

      webhooks.forEach((webhook, index) => {
        console.log(chalk.bold(`\n${index + 1}. ${webhook.url.substring(0, 50)}...`));
        console.log(chalk.gray(`   ID: ${webhook.id}`));
        console.log(chalk.gray(`   Status: ${webhook.status}`));
        console.log(chalk.gray(`   Events: ${webhook.events.join(', ')}`));
        console.log(chalk.gray(`   Created: ${new Date(webhook.createdAt).toLocaleDateString()}`));
        
        if (webhook.lastTriggered) {
          console.log(chalk.gray(`   Last triggered: ${new Date(webhook.lastTriggered).toLocaleDateString()}`));
        }
        
        console.log(chalk.gray('   ' + '─'.repeat(40)));
      });
      
      return;
    }

    if (options.create) {
      spinner.stop();
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Webhook URL:',
          validate: (input) => {
            try {
              new URL(input);
              return true;
            } catch {
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
      
const response = await axios.post(await buildApiUrl('/webhooks'), {
  url: answers.url,
  events: answers.events
}, { headers });

      
      const newWebhook: Webhook = response.data.webhook;
      
      spinner.succeed(chalk.green('✅ Webhook created successfully!'));
      
      console.log(chalk.cyan('\n🔔 Webhook Details\n'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`ID:     ${newWebhook.id}`));
      console.log(chalk.green(`URL:    ${newWebhook.url}`));
      console.log(chalk.green(`Status: ${newWebhook.status}`));
      console.log(chalk.green(`Events: ${newWebhook.events.join(', ')}`));
      
      console.log(chalk.yellow('\n📝 You can test this webhook with:'));
      console.log(chalk.cyan(`   mz webhook --simulate ${newWebhook.events[0]}\n`));
      
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
      
      // في الواقع، سيكون هذا اتصالاً بـ API
      // لكن في الوقت الحالي، سنعرض فقط مثالاً
      spinner.succeed(chalk.green(`✅ Simulating ${event}`));
      
      console.log(chalk.cyan('\n🔔 Webhook Simulation\n'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`Event: ${event}`));
      console.log(chalk.green(`Time:  ${new Date().toISOString()}`));
      
      // مثال على الـ payload
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
      
      console.log(chalk.green('\n📦 Example Payload:'));
      console.log(chalk.gray(JSON.stringify(examplePayload, null, 2)));
      
      console.log(chalk.yellow('\n💡 Tip: Use --webhook-url in mz serve to test locally'));
      console.log(chalk.cyan('   mz serve --webhook-url=http://localhost:3000/api/webhooks\n'));
      
      return;
    }

    // Default help
    spinner.stop();
    
    console.log(chalk.cyan('\n🔔 Webhook Management\n'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('Usage:'));
    console.log(chalk.yellow('  mz webhook --list                 ') + chalk.gray('# List all webhooks'));
    console.log(chalk.yellow('  mz webhook --create               ') + chalk.gray('# Create new webhook'));
    console.log(chalk.yellow('  mz webhook --simulate <event>     ') + chalk.gray('# Simulate webhook event'));
    console.log(chalk.yellow('  mz webhook --delete <id>          ') + chalk.gray('# Delete webhook'));
    console.log(chalk.yellow('  mz webhook --url <url>            ') + chalk.gray('# Set webhook URL'));
    console.log(chalk.yellow('  mz webhook --events <events>      ') + chalk.gray('# Set events (comma separated)\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Webhook command failed'));
    
    if (error.response) {
      console.error(chalk.red(`  Error ${error.response.status}: ${error.response.data.message || 'API error'}`));
    } else {
      console.error(chalk.red(`  Error: ${error.message}`));
    }
  }
}
