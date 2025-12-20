// /workspaces/mgzon-cli/src/commands/apps.ts
import chalk from 'chalk';
import ora from 'ora';
import { buildApiUrl, getAuthHeaders } from '../middleware/auth';
import axios from 'axios';
import inquirer from 'inquirer';

interface App {
  _id: string;
  name: string;
  description: string;
  slug: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
  updatedAt: string;
  environment: 'development' | 'staging' | 'production';
  isMarketplaceApp: boolean;
  targetAudience: 'DEVELOPER' | 'SELLER' | 'BOTH';
  domain?: string;
  domains?: Array<{
    domain: string;
    type: 'primary' | 'custom';
    verified: boolean;
    sslStatus: string;
  }>;
  version: string;
  installs: number;
  rating: number;
}

export async function appsCommand(options: any) {
  const spinner = ora('Processing...').start();

  try {
    const headers = await getAuthHeaders();

    if (options.list) {
      spinner.text = 'Fetching your apps...';
      
      // ⭐ استخدام buildApiUrl بشكل صحيح
      const apiUrl = await buildApiUrl('/apps');
      
      console.log(chalk.gray(`   Debug: Fetching apps from: ${apiUrl}`));
      
      const response = await axios.get(apiUrl, { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch apps');
      }
      
      const apps: App[] = response.data.data.apps;
      
      spinner.succeed(chalk.green(`✅ Found ${apps.length} app(s)`));
      
      console.log(chalk.cyan('\n📱 Your Apps\n'));
      console.log(chalk.gray('─'.repeat(80)));
      
      if (apps.length === 0) {
        console.log(chalk.yellow('No apps found. Create one with: mz apps --create <name>'));
        console.log(chalk.gray('Or deploy an existing project with: mz deploy'));
        return;
      }

      apps.forEach((app, index) => {
        const statusColors = {
          approved: chalk.green,
          pending: chalk.yellow,
          draft: chalk.blue,
          rejected: chalk.red,
          suspended: chalk.gray
        };
        
        console.log(chalk.bold(`\n${index + 1}. ${app.name}`));
        console.log(chalk.gray(`   ID: ${app._id}`));
        console.log(chalk.gray(`   Slug: ${app.slug}`));
        console.log(chalk.gray(`   Description: ${app.description || 'No description'}`));
        console.log(statusColors[app.status](`   Status: ${app.status.toUpperCase()}`));
        console.log(chalk.gray(`   Environment: ${app.environment}`));
        console.log(chalk.gray(`   Type: ${app.targetAudience}${app.isMarketplaceApp ? ' (Marketplace)' : ''}`));
        console.log(chalk.gray(`   Version: ${app.version}`));
        console.log(chalk.gray(`   Created: ${new Date(app.createdAt).toLocaleDateString()}`));
        
        if (app.domain) {
          console.log(chalk.gray(`   Domain: ${app.domain}`));
        }
        
        console.log(chalk.gray('   ' + '─'.repeat(40)));
      });
      
      console.log(chalk.cyan('\n📊 Stats:'));
      console.log(chalk.gray(`   Total: ${response.data.data.pagination?.total || apps.length}`));
      console.log(chalk.gray(`   Marketplace: ${response.data.data.stats?.marketplace || 0}`));
      console.log(chalk.gray(`   Private: ${response.data.data.stats?.private || 0}`));
      
      return;
    }

    if (options.create) {
      const appName = options.create as string;
      
      if (!appName || appName.length < 3) {
        throw new Error('App name must be at least 3 characters');
      }

      spinner.stop();
      
      const answers = await inquirer.prompt([
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
      
      // ⭐ استخدام buildApiUrl
      const apiUrl = await buildApiUrl('/apps');
      console.log(chalk.gray(`   Debug: Creating app at: ${apiUrl}`));
      
      const response = await axios.post(apiUrl, {
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
      
      spinner.succeed(chalk.green(`✅ App "${newApp.name}" created successfully!`));
      
      console.log(chalk.cyan('\n📱 App Details\n'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`ID:          ${newApp._id}`));
      console.log(chalk.green(`Name:        ${newApp.name}`));
      console.log(chalk.green(`Slug:        ${newApp.slug}`));
      console.log(chalk.green(`Status:      ${newApp.status}`));
      console.log(chalk.green(`Environment: ${newApp.environment}`));
      console.log(chalk.green(`Type:        ${newApp.targetAudience}`));
      console.log(chalk.green(`Created:     ${new Date(newApp.createdAt).toLocaleString()}`));
      
      if (response.data.credentials) {
        console.log(chalk.red('\n⚠️  IMPORTANT CREDENTIALS:'));
        console.log(chalk.green(`Client ID:     ${response.data.credentials.clientId}`));
        console.log(chalk.green(`Client Secret: ${response.data.credentials.clientSecret}`));
        console.log(chalk.red('Save these now - the secret won\'t be shown again!'));
      }
      
      console.log(chalk.yellow('\n🚀 Next steps:'));
      console.log(chalk.cyan('   1. Navigate to your project directory'));
      console.log(chalk.cyan('   2. Run: mz deploy'));
      console.log(chalk.cyan('   3. Your app will be deployed to MGZON\n'));
      
      return;
    }

    if (options.info) {
      const appId = options.info as string;
      spinner.text = 'Fetching app details...';
      
      // ⭐ استخدام buildApiUrl
      const apiUrl = await buildApiUrl(`/apps/${appId}`);
      console.log(chalk.gray(`   Debug: Fetching app details from: ${apiUrl}`));
      
      const response = await axios.get(apiUrl, { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch app details');
      }
      
      const app: App = response.data.data;
      
      spinner.succeed(chalk.green(`✅ App details for "${app.name}"`));
      
      console.log(chalk.cyan('\n📱 App Details\n'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`ID:          ${app._id}`));
      console.log(chalk.green(`Name:        ${app.name}`));
      console.log(chalk.green(`Slug:        ${app.slug}`));
      console.log(chalk.green(`Description: ${app.description || 'No description'}`));
      console.log(chalk.green(`Status:      ${app.status}`));
      console.log(chalk.green(`Environment: ${app.environment}`));
      console.log(chalk.green(`Type:        ${app.targetAudience}`));
      console.log(chalk.green(`Marketplace: ${app.isMarketplaceApp ? 'Yes' : 'No'}`));
      console.log(chalk.green(`Version:     ${app.version}`));
      console.log(chalk.green(`Installs:    ${app.installs || 0}`));
      console.log(chalk.green(`Rating:      ${app.rating || 'No ratings'}`));
      console.log(chalk.green(`Created:     ${new Date(app.createdAt).toLocaleString()}`));
      console.log(chalk.green(`Updated:     ${new Date(app.updatedAt).toLocaleString()}`));
      
      if (app.domain) {
        console.log(chalk.green('\n🌐 Domain:'));
        console.log(chalk.cyan(`   ${app.domain}`));
      }
      
      if (app.domains && app.domains.length > 0) {
        console.log(chalk.green('\n🌐 Domains:'));
        app.domains.forEach(domain => {
          console.log(chalk.cyan(`   - ${domain.domain} (${domain.type})`));
        });
      }
      
      console.log(chalk.yellow('\n🔗 App URLs:'));
      console.log(chalk.cyan(`   API Endpoint: ${await buildApiUrl(`/apps/${app._id}`)}`));
      if (app.domain) {
        console.log(chalk.cyan(`   Live URL: https://${app.domain}`));
      } else if (app.slug) {
        console.log(chalk.cyan(`   Development URL: https://${app.slug}.dev.mgzon.app`));
      }
      
      return;
    }

    if (options.delete) {
      const appId = options.delete as string;
      
      spinner.text = 'Checking app...';
      
      // First get app info
      const apiUrl = await buildApiUrl(`/apps/${appId}`);
      console.log(chalk.gray(`   Debug: Checking app at: ${apiUrl}`));
      
      const appResponse = await axios.get(apiUrl, { headers });
      
      if (!appResponse.data.success) {
        throw new Error('App not found');
      }
      
      const app = appResponse.data.data;
      
      spinner.stop();
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete app "${app.name}" (${app.slug})? This cannot be undone.`,
          default: false
        }
      ]);
      
      if (!confirm) {
        spinner.fail(chalk.yellow('Deletion cancelled'));
        return;
      }
      
      spinner.start('Deleting app...');
      
      console.log(chalk.gray(`   Debug: Deleting app at: ${apiUrl}`));
      const deleteResponse = await axios.delete(apiUrl, { headers });
      
      if (!deleteResponse.data.success) {
        throw new Error(deleteResponse.data.error || 'Failed to delete app');
      }
      
      spinner.succeed(chalk.green(`✅ App "${app.name}" deleted successfully`));
      return;
    }

    if (options.domains) {
      const appId = options.domains === true ? undefined : options.domains;
      
      if (!appId) {
        throw new Error('App ID required for domains command');
      }
      
      spinner.text = 'Fetching app domains...';
      
      // ⭐ استخدام buildApiUrl
      const apiUrl = await buildApiUrl(`/apps/${appId}/domains`);
      console.log(chalk.gray(`   Debug: Fetching domains from: ${apiUrl}`));
      
      const response = await axios.get(apiUrl, { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch domains');
      }
      
      const domains = response.data.data.domains;
      
      spinner.succeed(chalk.green(`✅ Found ${domains.length} domain(s)`));
      
      console.log(chalk.cyan('\n🌐 App Domains\n'));
      console.log(chalk.gray('─'.repeat(60)));
      
      if (domains.length === 0) {
        console.log(chalk.yellow('No domains found. Add one with:'));
        console.log(chalk.cyan(`  curl -X POST ${await buildApiUrl(`/apps/${appId}/domains`)} \\`));
        console.log(chalk.cyan(`    -H "Authorization: Bearer YOUR_API_KEY" \\`));
        console.log(chalk.cyan(`    -H "Content-Type: application/json" \\`));
        console.log(chalk.cyan(`    -d '{"domain": "your-domain.com"}'`));
        return;
      }

      domains.forEach((domain: any, index: number) => {
        console.log(chalk.bold(`\n${index + 1}. ${domain.domain}`));
        console.log(chalk.gray(`   Type: ${domain.type}`));
        console.log(chalk.gray(`   SSL: ${domain.sslStatus || 'Unknown'}`));
        console.log(chalk.gray(`   Verified: ${domain.verified ? '✅' : '❌'}`));
        console.log(chalk.gray(`   Created: ${new Date(domain.createdAt).toLocaleDateString()}`));
        console.log(chalk.gray('   ' + '─'.repeat(40)));
      });
      
      return;
    }

    if (options.logs) {
      const appId = options.logs === true ? undefined : options.logs;
      
      if (!appId) {
        throw new Error('App ID required for logs command');
      }
      
      spinner.text = 'Fetching app logs...';
      
      // ⭐ استخدام buildApiUrl
      const apiUrl = await buildApiUrl(`/apps/${appId}/logs`);
      console.log(chalk.gray(`   Debug: Fetching logs from: ${apiUrl}`));
      
      const response = await axios.get(apiUrl, { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch logs');
      }
      
      const logs = response.data.data.logs;
      const stats = response.data.data.stats;
      
      spinner.succeed(chalk.green(`✅ Found ${logs.length} log(s)`));
      
      console.log(chalk.cyan('\n📋 App Logs\n'));
      console.log(chalk.gray('─'.repeat(80)));
      
      if (logs.length === 0) {
        console.log(chalk.yellow('No logs found.'));
        return;
      }

      logs.forEach((log: any, index: number) => {
        const levelColors = {
          info: chalk.blue,
          warn: chalk.yellow,
          error: chalk.red
        };
        
        console.log(levelColors[log.level as keyof typeof levelColors](`\n${index + 1}. [${log.level.toUpperCase()}]`));
        console.log(chalk.gray(`   Time: ${new Date(log.timestamp).toLocaleString()}`));
        console.log(chalk.gray(`   Message: ${log.message}`));
        
        if (log.source) {
          console.log(chalk.gray(`   Source: ${log.source}`));
        }
        
        if (log.metadata) {
          console.log(chalk.gray(`   Metadata: ${JSON.stringify(log.metadata, null, 2)}`));
        }
        
        console.log(chalk.gray('   ' + '─'.repeat(40)));
      });
      
      console.log(chalk.cyan('\n📊 Log Statistics:'));
      console.log(chalk.gray(`   Total: ${stats.total}`));
      console.log(chalk.gray(`   Info: ${stats.byLevel?.info || 0}`));
      console.log(chalk.gray(`   Warnings: ${stats.byLevel?.warn || 0}`));
      console.log(chalk.gray(`   Errors: ${stats.byLevel?.error || 0}`));
      
      return;
    }

    // Default help
    spinner.stop();
    
    console.log(chalk.cyan('\n📱 Apps Management\n'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('Usage:'));
    console.log(chalk.yellow('  mz apps --list                    ') + chalk.gray('# List all apps'));
    console.log(chalk.yellow('  mz apps --create <name>           ') + chalk.gray('# Create new app'));
    console.log(chalk.yellow('  mz apps --info <app-id>           ') + chalk.gray('# Show app details'));
    console.log(chalk.yellow('  mz apps --delete <app-id>         ') + chalk.gray('# Delete an app'));
    console.log(chalk.yellow('  mz apps --domains <app-id>        ') + chalk.gray('# List app domains'));
    console.log(chalk.yellow('  mz apps --logs <app-id>           ') + chalk.gray('# View app logs\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Apps command failed'));
    
    if (error.response) {
      const errorData = error.response.data;
      console.error(chalk.red(`  Error ${error.response.status}: ${errorData?.error || errorData?.message || 'API error'}`));
      
      if (errorData?.suggestion) {
        console.error(chalk.yellow(`  Suggestion: ${errorData.suggestion}`));
      }
    } else {
      console.error(chalk.red(`  Error: ${error.message}`));
    }
    
    // ⭐ إضافة debug info
    console.log(chalk.gray('\n🔧 Debug Info:'));
    console.log(chalk.cyan('   Try: mz config --get apiUrl'));
    console.log(chalk.cyan('   Current API URL: ' + (await buildApiUrl('/test').catch(() => 'Unknown'))));
  }
}