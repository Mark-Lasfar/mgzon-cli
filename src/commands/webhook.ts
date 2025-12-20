// /workspaces/mgzon-cli/src/commands/webhook.ts
import chalk from 'chalk';
import ora from 'ora';
import axios, { AxiosError } from 'axios';
import inquirer from 'inquirer';
import { buildApiUrl, getAuthHeaders } from '../middleware/auth';

interface Webhook {
  _id: string;
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed';
  provider?: string;
  appId?: string;
  integrationId?: string;
  lastTriggered?: string;
  createdAt: string;
  retryCount?: number;
  lastError?: string;
  name?: string;
  description?: string;
  type?: 'system' | 'developer';
}

interface WebhookResponse {
  success: boolean;
  data: Webhook[];
  pagination?: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
  stats?: any;
}

export async function webhookCommand(options: any) {
  const spinner = ora('Processing...').start();

  try {
    const headers = await getAuthHeaders();

    // 1. عرض قائمة Webhooks مع دعم المطورين
    if (options.list) {
      spinner.text = 'Fetching webhooks...';
      
      const params: any = {
        limit: options.limit || 50,
        skip: options.skip || 0
      };

      if (options.provider) params.provider = options.provider;
      if (options.status) params.status = options.status;
      if (options.type) params.type = options.type; // 'system' أو 'developer'
      if (options.appId) params.appId = options.appId;

      // ⭐⭐ تصحيح المسار: استخدام المسار الصحيح بناءً على config
      const webhookEndpoint = '/api/v1/webhooks';
      console.log(chalk.gray(`   Debug: Fetching from endpoint: ${webhookEndpoint}`));
      
      const response = await axios.get<WebhookResponse>(
        await buildApiUrl(webhookEndpoint),
        { 
          headers,
          params
        }
      );

      const webhooks: Webhook[] = response.data.data || [];
      
      spinner.succeed(chalk.green(`✅ Found ${webhooks.length} webhook(s)`));
      
      // عرض حسب النوع
      const systemWebhooks = webhooks.filter(w => w.type === 'system' || !w.type);
      const developerWebhooks = webhooks.filter(w => w.type === 'developer');
      
      console.log(chalk.cyan('\n🔔 Your Webhooks\n'));
      console.log(chalk.gray('─'.repeat(80)));
      
      if (systemWebhooks.length > 0) {
        console.log(chalk.bold('\n📦 System Webhooks:'));
        systemWebhooks.forEach((webhook, index) => {
          const statusColor = webhook.status === 'active' ? chalk.green : 
                            webhook.status === 'failed' ? chalk.red : chalk.yellow;
          
          console.log(chalk.bold(`\n${index + 1}. ${webhook.url.substring(0, 60)}...`));
          console.log(chalk.gray(`   ID: ${webhook._id || webhook.id}`));
          console.log(chalk.gray(`   Status: ${statusColor(webhook.status)}`));
          console.log(chalk.gray(`   Provider: ${webhook.provider || 'System'}`));
          console.log(chalk.gray(`   Events: ${webhook.events.join(', ')}`));
          console.log(chalk.gray(`   Created: ${new Date(webhook.createdAt).toLocaleDateString()}`));
          
          if (webhook.lastTriggered) {
            console.log(chalk.gray(`   Last triggered: ${new Date(webhook.lastTriggered).toLocaleDateString()}`));
          }
          
          if (webhook.retryCount && webhook.retryCount > 0) {
            console.log(chalk.yellow(`   Retry count: ${webhook.retryCount}`));
          }
          
          console.log(chalk.gray('   ' + '─'.repeat(40)));
        });
      }

      if (developerWebhooks.length > 0) {
        console.log(chalk.bold('\n👨‍💻 Developer Webhooks:'));
        developerWebhooks.forEach((webhook, index) => {
          const statusColor = webhook.status === 'active' ? chalk.green : 
                            webhook.status === 'failed' ? chalk.red : chalk.yellow;
          
          console.log(chalk.bold(`\n${index + 1}. ${webhook.name || 'Developer Webhook'}`));
          console.log(chalk.gray(`   ID: ${webhook._id || webhook.id}`));
          console.log(chalk.gray(`   URL: ${webhook.url.substring(0, 50)}...`));
          console.log(chalk.gray(`   Status: ${statusColor(webhook.status)}`));
          console.log(chalk.gray(`   App ID: ${webhook.appId || 'N/A'}`));
          console.log(chalk.gray(`   Events: ${webhook.events.join(', ')}`));
          console.log(chalk.gray(`   Created: ${new Date(webhook.createdAt).toLocaleDateString()}`));
          
          if (webhook.description) {
            console.log(chalk.gray(`   Description: ${webhook.description.substring(0, 100)}...`));
          }
          
          console.log(chalk.gray('   ' + '─'.repeat(40)));
        });
      }

      if (webhooks.length === 0) {
        console.log(chalk.yellow('No webhooks found.'));
        console.log(chalk.gray('For system webhooks: mz webhook --create'));
        console.log(chalk.gray('For developer webhooks: mz webhook --create-dev --app-id=<app-id>'));
        return;
      }

      if (response.data.stats) {
        console.log(chalk.cyan('\n📊 Webhook Statistics:'));
        console.log(chalk.gray(`   Total: ${response.data.stats.totalWebhooks || 0}`));
        console.log(chalk.gray(`   Successful: ${response.data.stats.successfulWebhooks || 0}`));
        console.log(chalk.gray(`   Failed: ${response.data.stats.failedWebhooks || 0}`));
        console.log(chalk.gray(`   Last 24h: ${response.data.stats.last24Hours || 0}`));
      }

      if (response.data.pagination?.hasMore) {
        console.log(chalk.cyan(`\n📄 Showing ${webhooks.length} of ${response.data.pagination.total} webhooks`));
        console.log(chalk.gray('Use --skip and --limit for pagination'));
      }
      
      return;
    }

    // 2. إنشاء Webhook جديد للمطور
    if (options['create-dev']) {
      spinner.stop();
      
      // الحصول على تطبيقات المطور
      try {
        // ⭐⭐ تصحيح المسار: استخدام المسار الصحيح
        const appsEndpoint = '/api/v1/apps';
        const appsRes = await axios.get(
          await buildApiUrl(appsEndpoint),
          { headers }
        );

        const apps = appsRes.data.data?.apps || [];
        const developerApps = apps.filter((app: any) => 
          app.targetAudience === 'DEVELOPER' || app.isMarketplaceApp
        );

        if (developerApps.length === 0) {
          console.log(chalk.yellow('No developer apps found. Create one first:'));
          console.log(chalk.cyan('  mz apps --create <app-name>'));
          return;
        }

        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'appId',
            message: 'Select developer app:',
            choices: developerApps.map((app: any) => ({
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
              } catch {
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
        
        // ⭐⭐ تصحيح: استخدام PUT method مع المسار الصحيح
        const createEndpoint = '/api/v1/webhooks';
        console.log(chalk.gray(`   Debug: Creating webhook at: ${createEndpoint}`));
        
        const response = await axios.put(
          await buildApiUrl(createEndpoint),
          {
            url: answers.url,
            events: answers.events,
            name: answers.name,
            description: answers.description,
            appId: answers.appId,
            developerId: 'current' // سيتم استبداله بالـ server
          },
          { headers }
        );

        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to create developer webhook');
        }

        const newWebhook = response.data.data;
        
        spinner.succeed(chalk.green('✅ Developer webhook created successfully!'));
        
        console.log(chalk.cyan('\n👨‍💻 Developer Webhook Details\n'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.green(`ID:          ${newWebhook.id}`));
        console.log(chalk.green(`Name:        ${answers.name}`));
        console.log(chalk.green(`URL:         ${answers.url}`));
        console.log(chalk.green(`App ID:      ${answers.appId}`));
        console.log(chalk.green(`Status:      active`));
        console.log(chalk.green(`Events:      ${answers.events.join(', ')}`));
        
        console.log(chalk.red('\n⚠️  IMPORTANT:'));
        console.log(chalk.green(`Webhook Secret: ${newWebhook.secret || 'Not shown'}`));
        console.log(chalk.red('Save this secret now - it will not be shown again!'));
        
        console.log(chalk.yellow('\n📝 How to use:'));
        console.log(chalk.cyan('  1. Configure your server to listen to the webhook URL'));
        console.log(chalk.cyan('  2. Verify signatures using the webhook secret'));
        console.log(chalk.cyan('  3. Test with: mz webhook --test-dev --event=developer.app.installed'));
        
      } catch (error: any) {
        throw new Error(`Failed to create developer webhook: ${error.message}`);
      }
      
      return;
    }

    // 3. اختبار Webhook للمطورين
    if (options['test-dev']) {
      spinner.text = 'Testing developer webhook...';
      
      const appId = options['app-id'];
      const event = options.event || options['test-dev'];
      
      if (!appId) {
        spinner.fail(chalk.red('App ID is required for developer webhook testing'));
        console.log(chalk.yellow('Use: mz webhook --test-dev --event=<event> --app-id=<app-id>'));
        return;
      }

      // بيانات اختبار لتطبيقات المطورين
      const testData: Record<string, any> = {
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

      // الحصول على معلومات التطبيق
      // ⭐⭐ تصحيح المسار: استخدام المسار الصحيح
      const appInfoEndpoint = `/api/v1/apps/${appId}`;
      const appResponse = await axios.get(
        await buildApiUrl(appInfoEndpoint),
        { headers }
      );

      const app = appResponse.data.data;
      const webhookUrl = app.webhook?.url || options.url;

      if (!webhookUrl) {
        spinner.stop();
        console.log(chalk.yellow(`\n⚠️  No webhook URL configured for app: ${app.name}`));
        console.log(chalk.cyan('\nExample payload:'));
        console.log(chalk.gray(JSON.stringify(payload, null, 2)));
        
        console.log(chalk.yellow('\n💡 To set up a webhook:'));
        console.log(chalk.cyan('  1. Run: mz webhook --create-dev --app-id=' + appId));
        console.log(chalk.cyan('  2. Configure your server to listen at the webhook URL'));
        console.log(chalk.cyan('  3. Test with this command again\n'));
        return;
      }

      try {
        // إضافة توقيع للاختبار
        const webhookSecret = app.webhook?.secret || 'test_secret';
        const crypto = await import('crypto');
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

        const response = await axios.post(webhookUrl, payload, { 
          headers: testHeaders,
          timeout: 10000
        });
        
        spinner.succeed(chalk.green(`✅ Developer webhook test successful to ${webhookUrl}`));
        
        console.log(chalk.cyan('\n👨‍💻 Developer Webhook Test Results\n'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.green(`App:       ${app.name}`));
        console.log(chalk.green(`Event:     ${event}`));
        console.log(chalk.green(`URL:       ${webhookUrl}`));
        console.log(chalk.green(`Status:    ${response.status}`));
        console.log(chalk.green(`Time:      ${new Date().toISOString()}`));
        
        console.log(chalk.green('\n📦 Sent Payload:'));
        console.log(chalk.gray(JSON.stringify(payload, null, 2)));
        
        console.log(chalk.green('\n📥 Response:'));
        console.log(chalk.gray(JSON.stringify(response.data, null, 2)));
        
      } catch (error: any) {
        spinner.fail(chalk.red(`❌ Developer webhook test failed to ${webhookUrl}`));
        console.error(chalk.red(`Error: ${error.message}`));
        if (error.response) {
          console.error(chalk.red(`Response: ${JSON.stringify(error.response.data, null, 2)}`));
        }
      }
      
      return;
    }

    // 4. إنشاء Webhook عادي (نظام)
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
      
      // ⭐⭐ تصحيح: استخدام POST method مع المسار الصحيح
      const createEndpoint = '/api/v1/webhooks';
      console.log(chalk.gray(`   Debug: Creating webhook at: ${createEndpoint}`));
      
      const response = await axios.post(
        await buildApiUrl(createEndpoint),
        {
          url: answers.url,
          events: answers.events,
          provider: answers.provider
        },
        { headers }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create webhook');
      }

      const newWebhook = response.data.data || response.data;
      
      spinner.succeed(chalk.green('✅ Webhook created successfully!'));
      
      console.log(chalk.cyan('\n🔔 Webhook Details\n'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`ID:       ${newWebhook._id || newWebhook.id}`));
      console.log(chalk.green(`URL:      ${newWebhook.url}`));
      console.log(chalk.green(`Status:   ${newWebhook.status || 'active'}`));
      console.log(chalk.green(`Provider: ${newWebhook.provider || 'custom'}`));
      console.log(chalk.green(`Events:   ${newWebhook.events.join(', ')}`));
      
      console.log(chalk.yellow('\n📝 You can test this webhook with:'));
      console.log(chalk.cyan(`   mz webhook --test --event=${newWebhook.events[0] || 'order.created'}\n`));
      
      return;
    }

    // 5. اختبار Webhook
    if (options.test || options.simulate) {
      spinner.text = 'Testing webhook...';
      
      const provider = options.provider || 'custom';
      const event = options.event || options.test || options.simulate;
      
      // بيانات اختبار مختلفة لكل نوع حدث
      const testData: Record<string, any> = {
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

      // إذا كان هناك URL محدد، ارسل إليه مباشرة
      if (options.url) {
        try {
          const response = await axios.post(options.url, payload);
          
          spinner.succeed(chalk.green(`✅ Webhook test successful to ${options.url}`));
          
          console.log(chalk.cyan('\n🔔 Webhook Test Results\n'));
          console.log(chalk.gray('─'.repeat(50)));
          console.log(chalk.green(`Status: ${response.status}`));
          console.log(chalk.green(`Event:  ${event}`));
          console.log(chalk.green(`Time:   ${new Date().toISOString()}`));
          
          console.log(chalk.green('\n📦 Sent Payload:'));
          console.log(chalk.gray(JSON.stringify(payload, null, 2)));
          
          console.log(chalk.green('\n📥 Response:'));
          console.log(chalk.gray(JSON.stringify(response.data, null, 2)));
          
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ Webhook test failed to ${options.url}`));
          console.error(chalk.red(`Error: ${error.message}`));
          if (error.response) {
            console.error(chalk.red(`Response: ${JSON.stringify(error.response.data, null, 2)}`));
          }
        }
      } else {
        // عرض مثال فقط
        spinner.succeed(chalk.green(`✅ Test payload generated for ${event}`));
        
        console.log(chalk.cyan('\n🔔 Webhook Test Example\n'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.green(`Event: ${event}`));
        console.log(chalk.green(`Time:  ${new Date().toISOString()}`));
        
        console.log(chalk.green('\n📦 Example Payload:'));
        console.log(chalk.gray(JSON.stringify(payload, null, 2)));
        
        console.log(chalk.yellow('\n💡 To test with actual URL:'));
        console.log(chalk.cyan(`   mz webhook --test --event=${event} --url=https://your-webhook-url.com\n`));
        console.log(chalk.cyan(`   OR use ngrok for local testing:`));
        console.log(chalk.cyan(`   ngrok http 3000`));
        console.log(chalk.cyan(`   mz webhook --test --event=${event} --url=https://your-ngrok-url.ngrok.io/api/v1/webhooks\n`));
      }
      
      return;
    }

    // 6. حذف Webhook
    if (options.delete) {
      const webhookId = options.delete;
      
      spinner.text = `Deleting webhook ${webhookId}...`;
      
      // ⭐⭐ تصحيح المسار: استخدام المسار الصحيح
      const deleteEndpoint = `/api/v1/webhooks?id=${webhookId}`;
      console.log(chalk.gray(`   Debug: Deleting webhook at: ${deleteEndpoint}`));
      
      const response = await axios.delete(
        await buildApiUrl(deleteEndpoint),
        { headers }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete webhook');
      }

      spinner.succeed(chalk.green(`✅ Webhook deleted successfully`));
      console.log(chalk.green(`ID: ${webhookId}`));
      
      return;
    }

    // 7. عرض المساعدة المتقدمة
    spinner.stop();
    
    console.log(chalk.cyan('\n🔔 Webhook Management CLI\n'));
    console.log(chalk.gray('─'.repeat(50)));
    
    console.log(chalk.bold('\n👨‍💻 Developer Commands:'));
    console.log(chalk.yellow('  mz webhook --list --type=developer        ') + chalk.gray('# List developer webhooks'));
    console.log(chalk.yellow('  mz webhook --create-dev                   ') + chalk.gray('# Create developer webhook'));
    console.log(chalk.yellow('  mz webhook --test-dev --event=<event> --app-id=<id> ') + chalk.gray('# Test developer webhook'));
    console.log(chalk.yellow('  mz webhook --list --app-id=<app-id>       ') + chalk.gray('# List webhooks for specific app'));
    
    console.log(chalk.bold('\n🔧 System Commands:'));
    console.log(chalk.yellow('  mz webhook --list                          ') + chalk.gray('# List all webhooks'));
    console.log(chalk.yellow('  mz webhook --create                        ') + chalk.gray('# Create system webhook'));
    console.log(chalk.yellow('  mz webhook --test --event=<event>          ') + chalk.gray('# Test system webhook'));
    console.log(chalk.yellow('  mz webhook --delete <id>                   ') + chalk.gray('# Delete webhook'));
    
    console.log(chalk.bold('\n📊 Filtering:'));
    console.log(chalk.yellow('  --provider=<provider>                      ') + chalk.gray('# Filter by provider'));
    console.log(chalk.yellow('  --status=<status>                          ') + chalk.gray('# Filter by status'));
    console.log(chalk.yellow('  --type=<type>                              ') + chalk.gray('# system or developer'));
    console.log(chalk.yellow('  --app-id=<id>                              ') + chalk.gray('# Filter by app ID'));
    
    console.log(chalk.gray('\nExamples:'));
    console.log(chalk.cyan('  # إنشاء webhook عادي'));
    console.log(chalk.cyan('  mz webhook --create'));
    
    console.log(chalk.cyan('  # إنشاء webhook لتطبيق مطور'));
    console.log(chalk.cyan('  mz webhook --create-dev'));
    
    console.log(chalk.cyan('  # اختبار تثبيت تطبيق'));
    console.log(chalk.cyan('  mz webhook --test-dev --event="developer.app.installed" --app-id=123'));
    
    console.log(chalk.cyan('  # عرض جميع webhooks المطور'));
    console.log(chalk.cyan('  mz webhook --list --type=developer'));
    
    console.log(chalk.cyan('  # اختبار webhook محلي باستخدام ngrok'));
    console.log(chalk.cyan('  ngrok http 3000'));
    console.log(chalk.cyan('  mz webhook --test --event="order.created" --url=https://your-ngrok.ngrok.io/api/v1/webhooks\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Webhook command failed'));
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error(chalk.red(`  Error ${axiosError.response.status}:`));
        if (axiosError.response.data) {
          console.error(chalk.red(`  ${JSON.stringify(axiosError.response.data, null, 2)}`));
        }
      } else {
        console.error(chalk.red(`  Error: ${axiosError.message}`));
      }
      
      // ⭐⭐ إضافة debug info مفيدة
      console.log(chalk.gray('\n🔧 Debug Info:'));
      console.log(chalk.cyan(`   Current API URL: ${await (async () => {
        try {
          const { getApiUrl } = await import('../utils/config');
          return await getApiUrl();
        } catch {
          return 'Unknown';
        }
      })()}`));
      
    } else {
      console.error(chalk.red(`  Error: ${error.message}`));
    }
  }
}