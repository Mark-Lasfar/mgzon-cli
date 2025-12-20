// /workspaces/mgzon-cli/src/commands/keys.ts
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
    console.log(chalk.gray('   Debug: Getting auth headers...'));
    const headers = await getAuthHeaders();
    const apiUrl = await buildApiUrl('/keys');
    
    console.log(chalk.gray(`   Debug: API URL: ${apiUrl}`));

    if (options.list) {
      spinner.text = 'Fetching API keys...';
      
      // ⭐ استخدام المسار الصحيح عبر بوابة CLI
      console.log(chalk.gray(`   Debug: Making GET request to ${apiUrl}`));
      const response = await axios.get(apiUrl, { 
        headers,
        timeout: 10000 
      });
      
      console.log(chalk.gray(`   Debug: Response status: ${response.status}`));
      
      // ✅ Handle different response formats
      let keys: ApiKey[] = [];
      
      if (response.data.data?.apiKeys) {
        keys = response.data.data.apiKeys;
      } else if (response.data.keys) {
        keys = response.data.keys;
      } else if (response.data.data) {
        keys = response.data.data;
      } else if (Array.isArray(response.data)) {
        keys = response.data;
      }
      
      spinner.succeed(chalk.green(`✅ Found ${keys.length} API key(s)`));
      
      console.log(chalk.cyan('\n🔑 API Keys\n'));
      console.log(chalk.gray('─'.repeat(80)));
      
      if (keys.length === 0) {
        console.log(chalk.yellow('No API keys found. Generate one with: mz keys --generate'));
        console.log(chalk.gray('   Or use CLI portal to manage keys: https://mgzon.com/developers/keys'));
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
      
      console.log(chalk.gray(`   Debug: Generating ${keyType} key: ${keyName}`));
      
      const requestBody = {
        name: keyName,
        type: keyType,
        permissions: ['products:read', 'orders:read', 'apps:read', 'apps:write', 'api:keys:read'],
        expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
      };
      
      console.log(chalk.gray(`   Debug: Request body: ${JSON.stringify(requestBody)}`));
      
      // ⭐ استخدام بوابة CLI
      const response = await axios.post(apiUrl, requestBody, { 
        headers,
        timeout: 10000 
      });
      
      console.log(chalk.gray(`   Debug: Response status: ${response.status}`));
      
      const newKey = response.data.data || response.data;
      
      if (!newKey) {
        throw new Error('No key data returned from API');
      }
      
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
      
      console.log(chalk.cyan('🎯 Next Steps:'));
      console.log(chalk.gray('   export MGZON_API_KEY="' + (newKey.key || newKey.id) + '"'));
      console.log(chalk.gray('   mz login'));
      console.log('');
      
      return;
    }

    if (options.revoke) {
      spinner.text = 'Revoking API key...';
      
      const keyId = options.revoke;
      const deleteUrl = await buildApiUrl(`/keys/${keyId}`);
      
      console.log(chalk.gray(`   Debug: Deleting key ${keyId} at ${deleteUrl}`));
      
      await axios.delete(deleteUrl, { 
        headers,
        timeout: 10000 
      });
      
      spinner.succeed(chalk.green(`✅ API key ${keyId} revoked successfully`));
      
      console.log(chalk.yellow('\n⚠️  Key has been permanently deleted.'));
      console.log(chalk.cyan('   Any applications using this key will stop working.\n'));
      
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
    
    console.log(chalk.cyan('💡 Tips:'));
    console.log(chalk.gray('   - Use developer keys for CLI access'));
    console.log(chalk.gray('   - Use seller keys for store API access'));
    console.log(chalk.gray('   - Store keys in password manager or .env file'));
    console.log('');

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Keys command failed'));
    
    console.log(chalk.gray('─'.repeat(50)));
    
    if (error.response) {
      console.error(chalk.red(`  Error ${error.response.status}: ${error.response.statusText}`));
      
      if (error.response.data?.error) {
        console.error(chalk.red(`  Message: ${error.response.data.error}`));
      }
      if (error.response.data?.message) {
        console.error(chalk.red(`  Details: ${error.response.data.message}`));
      }
      
      console.log(chalk.gray(`  URL: ${error.config?.url}`));
      
      if (error.response.status === 401) {
        console.log(chalk.cyan('\n  🔐 Authentication required.'));
        console.log(chalk.cyan('     Run: mz login'));
      } else if (error.response.status === 403) {
        console.log(chalk.cyan('\n  🚫 Insufficient permissions.'));
        console.log(chalk.cyan('     Your API key may not have "api:keys:read" permission.'));
      } else if (error.response.status === 404) {
        console.log(chalk.cyan('\n  🔍 Endpoint not found.'));
        console.log(chalk.cyan('     Check API URL: ' + error.config?.url));
        console.log(chalk.cyan('     Try: mz config --set apiUrl=http://localhost:3000/api/v1'));
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error(chalk.red('  Cannot connect to API server'));
      console.log(chalk.cyan('  → Is the server running?'));
      console.log(chalk.cyan('  → Check URL: ' + await buildApiUrl('/keys')));
    } else if (error.code === 'ETIMEDOUT') {
      console.error(chalk.red('  Request timeout'));
      console.log(chalk.cyan('  → The server is taking too long to respond'));
    } else {
      console.error(chalk.red(`  Error: ${error.message}`));
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('\n💡 Quick Fixes:'));
    console.log(chalk.cyan('  1. Check server: curl ' + await buildApiUrl('/keys')));
    console.log(chalk.cyan('  2. Set correct URL: mz config --set apiUrl=http://localhost:3000/api/v1'));
    console.log(chalk.cyan('  3. Verify login: mz whoami\n'));
  }
}