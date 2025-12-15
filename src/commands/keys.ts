import chalk from 'chalk';
import ora from 'ora';
import { buildApiUrl, getAuthHeaders } from '../middleware/auth';
import axios from 'axios';

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  expiresAt?: string;
  permissions: string[];
  lastUsed?: string;
  key?: string;
  type?: string;
}

export async function keysCommand(options: any) {
  const spinner = ora('Processing...').start();

  try {
    const headers = await getAuthHeaders();

    if (options.list) {
      spinner.text = 'Fetching API keys...';
      
      // ⭐ استخدام المسار الصحيح عبر بوابة CLI
      const response = await axios.get(await buildApiUrl('/keys'), { headers });
      const keys: ApiKey[] = response.data.data?.apiKeys || response.data.keys || [];
      
      spinner.succeed(chalk.green(`✅ Found ${keys.length} API key(s)`));
      
      console.log(chalk.cyan('\n🔑 API Keys\n'));
      console.log(chalk.gray('─'.repeat(80)));
      
      if (keys.length === 0) {
        console.log(chalk.yellow('No API keys found. Generate one with: mz keys --generate'));
        return;
      }

      keys.forEach((key, index) => {
        console.log(chalk.bold(`\n${index + 1}. ${key.name}`));
        console.log(chalk.gray(`   ID: ${key.id}`));
        console.log(chalk.gray(`   Type: ${key.type || 'seller'}`));
        console.log(chalk.gray(`   Created: ${new Date(key.createdAt).toLocaleDateString()}`));
        
        if (key.expiresAt) {
          const expiresDate = new Date(key.expiresAt);
          const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const color = daysLeft < 7 ? 'red' : daysLeft < 30 ? 'yellow' : 'green';
          console.log(chalk[color](`   Expires in: ${daysLeft} days`));
        } else {
          console.log(chalk.green(`   Expires: Never`));
        }
        
        console.log(chalk.gray(`   Permissions: ${key.permissions?.join(', ') || 'None'}`));
        
        if (key.lastUsed) {
          console.log(chalk.gray(`   Last used: ${new Date(key.lastUsed).toLocaleDateString()}`));
        }
        
        console.log(chalk.gray('   ' + '─'.repeat(40)));
      });
      
      return;
    }

    if (options.generate) {
      spinner.text = 'Generating new API key...';
      
      const keyName = options.name || `CLI Key ${new Date().toLocaleDateString()}`;
      const expiresDays = parseInt(options.expires) || 365;
      const keyType = options.type || 'developer';
      
      // ⭐ استخدام بوابة CLI
      const response = await axios.post(await buildApiUrl('/keys'), {
        name: keyName,
        type: keyType,
        permissions: ['products:read', 'orders:read', 'apps:read', 'apps:write', 'api:keys:read'],
        expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
      }, { headers });
      
      const newKey = response.data.data || response.data;
      
      spinner.succeed(chalk.green('✅ API key generated successfully!'));
      
      console.log(chalk.cyan('\n🔑 New API Key\n'));
      console.log(chalk.gray('─'.repeat(80)));
      console.log(chalk.green(`Name:       ${newKey.name}`));
      console.log(chalk.green(`Key:        ${newKey.key || newKey.id}`));
      console.log(chalk.green(`ID:         ${newKey.id}`));
      console.log(chalk.green(`Type:       ${newKey.type || keyType}`));
      console.log(chalk.green(`Created:    ${new Date(newKey.createdAt).toLocaleString()}`));
      
      if (newKey.expiresAt) {
        const expiresDate = new Date(newKey.expiresAt);
        console.log(chalk.green(`Expires:    ${expiresDate.toLocaleDateString()}`));
      }
      
      console.log(chalk.red('\n⚠️  IMPORTANT: Copy this key now. You won\'t see it again!'));
      console.log(chalk.yellow('   Store it in a secure place.\n'));
      
      return;
    }

    if (options.revoke) {
      spinner.text = 'Revoking API key...';
      
      await axios.delete(await buildApiUrl(`/keys/${options.revoke}`), { headers });
      
      spinner.succeed(chalk.green(`✅ API key ${options.revoke} revoked successfully`));
      return;
    }

    // Default help
    spinner.stop();
    
    console.log(chalk.cyan('\n🔑 API Keys Management\n'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('Usage:'));
    console.log(chalk.yellow('  mz keys --list                    ') + chalk.gray('# List all API keys'));
    console.log(chalk.yellow('  mz keys --generate --name="My Key"') + chalk.gray('# Generate new key'));
    console.log(chalk.yellow('  mz keys --revoke <key-id>         ') + chalk.gray('# Revoke a key'));
    console.log(chalk.yellow('  mz keys --generate --type=developer') + chalk.gray('# Generate developer key'));
    console.log(chalk.yellow('  mz keys --generate --expires=30   ') + chalk.gray('# Generate key expiring in 30 days\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Keys command failed'));
    
    if (error.response) {
      console.error(chalk.red(`  Error ${error.response.status}: ${error.response.data.error || error.response.data.message || 'API error'}`));
    } else {
      console.error(chalk.red(`  Error: ${error.message}`));
    }
  }
}
