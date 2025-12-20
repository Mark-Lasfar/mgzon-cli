"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.keysCommand = keysCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const auth_1 = require("../middleware/auth");
const axios_1 = __importDefault(require("axios"));
async function keysCommand(options) {
    const spinner = (0, ora_1.default)('Processing...').start();
    try {
        console.log(chalk_1.default.gray('   Debug: Getting auth headers...'));
        const headers = await (0, auth_1.getAuthHeaders)();
        const apiUrl = await (0, auth_1.buildApiUrl)('/keys');
        console.log(chalk_1.default.gray(`   Debug: API URL: ${apiUrl}`));
        if (options.list) {
            spinner.text = 'Fetching API keys...';
            console.log(chalk_1.default.gray(`   Debug: Making GET request to ${apiUrl}`));
            const response = await axios_1.default.get(apiUrl, {
                headers,
                timeout: 10000
            });
            console.log(chalk_1.default.gray(`   Debug: Response status: ${response.status}`));
            let keys = [];
            if (response.data.data?.apiKeys) {
                keys = response.data.data.apiKeys;
            }
            else if (response.data.keys) {
                keys = response.data.keys;
            }
            else if (response.data.data) {
                keys = response.data.data;
            }
            else if (Array.isArray(response.data)) {
                keys = response.data;
            }
            spinner.succeed(chalk_1.default.green(`✅ Found ${keys.length} API key(s)`));
            console.log(chalk_1.default.cyan('\n🔑 API Keys\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            if (keys.length === 0) {
                console.log(chalk_1.default.yellow('No API keys found. Generate one with: mz keys --generate'));
                console.log(chalk_1.default.gray('   Or use CLI portal to manage keys: https://mgzon.com/developers/keys'));
                return;
            }
            keys.forEach((key, index) => {
                console.log(chalk_1.default.bold(`\n${index + 1}. ${key.name}`));
                console.log(chalk_1.default.gray(`   ID: ${key.id}`));
                console.log(chalk_1.default.gray(`   Type: ${key.type || 'seller'}`));
                console.log(chalk_1.default.gray(`   Created: ${new Date(key.createdAt).toLocaleDateString()}`));
                if (key.expiresAt) {
                    const expiresDate = new Date(key.expiresAt);
                    const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const color = daysLeft < 7 ? 'red' : daysLeft < 30 ? 'yellow' : 'green';
                    console.log(chalk_1.default[color](`   Expires in: ${daysLeft} days`));
                }
                else {
                    console.log(chalk_1.default.green(`   Expires: Never`));
                }
                console.log(chalk_1.default.gray(`   Permissions: ${key.permissions?.join(', ') || 'None'}`));
                if (key.lastUsed) {
                    console.log(chalk_1.default.gray(`   Last used: ${new Date(key.lastUsed).toLocaleDateString()}`));
                }
                console.log(chalk_1.default.gray('   ' + '─'.repeat(40)));
            });
            return;
        }
        if (options.generate) {
            spinner.text = 'Generating new API key...';
            const keyName = options.name || `CLI Key ${new Date().toLocaleDateString()}`;
            const expiresDays = parseInt(options.expires) || 365;
            const keyType = options.type || 'developer';
            console.log(chalk_1.default.gray(`   Debug: Generating ${keyType} key: ${keyName}`));
            const requestBody = {
                name: keyName,
                type: keyType,
                permissions: ['products:read', 'orders:read', 'apps:read', 'apps:write', 'api:keys:read'],
                expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
            };
            console.log(chalk_1.default.gray(`   Debug: Request body: ${JSON.stringify(requestBody)}`));
            const response = await axios_1.default.post(apiUrl, requestBody, {
                headers,
                timeout: 10000
            });
            console.log(chalk_1.default.gray(`   Debug: Response status: ${response.status}`));
            const newKey = response.data.data || response.data;
            if (!newKey) {
                throw new Error('No key data returned from API');
            }
            spinner.succeed(chalk_1.default.green('✅ API key generated successfully!'));
            console.log(chalk_1.default.cyan('\n🔑 New API Key\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            console.log(chalk_1.default.green(`Name:       ${newKey.name}`));
            console.log(chalk_1.default.green(`Key:        ${newKey.key || newKey.id}`));
            console.log(chalk_1.default.green(`ID:         ${newKey.id}`));
            console.log(chalk_1.default.green(`Type:       ${newKey.type || keyType}`));
            console.log(chalk_1.default.green(`Created:    ${new Date(newKey.createdAt).toLocaleString()}`));
            if (newKey.expiresAt) {
                const expiresDate = new Date(newKey.expiresAt);
                console.log(chalk_1.default.green(`Expires:    ${expiresDate.toLocaleDateString()}`));
            }
            console.log(chalk_1.default.red('\n⚠️  IMPORTANT: Copy this key now. You won\'t see it again!'));
            console.log(chalk_1.default.yellow('   Store it in a secure place.\n'));
            console.log(chalk_1.default.cyan('🎯 Next Steps:'));
            console.log(chalk_1.default.gray('   export MGZON_API_KEY="' + (newKey.key || newKey.id) + '"'));
            console.log(chalk_1.default.gray('   mz login'));
            console.log('');
            return;
        }
        if (options.revoke) {
            spinner.text = 'Revoking API key...';
            const keyId = options.revoke;
            const deleteUrl = await (0, auth_1.buildApiUrl)(`/keys/${keyId}`);
            console.log(chalk_1.default.gray(`   Debug: Deleting key ${keyId} at ${deleteUrl}`));
            await axios_1.default.delete(deleteUrl, {
                headers,
                timeout: 10000
            });
            spinner.succeed(chalk_1.default.green(`✅ API key ${keyId} revoked successfully`));
            console.log(chalk_1.default.yellow('\n⚠️  Key has been permanently deleted.'));
            console.log(chalk_1.default.cyan('   Any applications using this key will stop working.\n'));
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.cyan('\n🔑 API Keys Management\n'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('Usage:'));
        console.log(chalk_1.default.yellow('  mz keys --list                    ') + chalk_1.default.gray('# List all API keys'));
        console.log(chalk_1.default.yellow('  mz keys --generate --name="My Key"') + chalk_1.default.gray('# Generate new key'));
        console.log(chalk_1.default.yellow('  mz keys --revoke <key-id>         ') + chalk_1.default.gray('# Revoke a key'));
        console.log(chalk_1.default.yellow('  mz keys --generate --type=developer') + chalk_1.default.gray('# Generate developer key'));
        console.log(chalk_1.default.yellow('  mz keys --generate --expires=30   ') + chalk_1.default.gray('# Generate key expiring in 30 days\n'));
        console.log(chalk_1.default.cyan('💡 Tips:'));
        console.log(chalk_1.default.gray('   - Use developer keys for CLI access'));
        console.log(chalk_1.default.gray('   - Use seller keys for store API access'));
        console.log(chalk_1.default.gray('   - Store keys in password manager or .env file'));
        console.log('');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Keys command failed'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        if (error.response) {
            console.error(chalk_1.default.red(`  Error ${error.response.status}: ${error.response.statusText}`));
            if (error.response.data?.error) {
                console.error(chalk_1.default.red(`  Message: ${error.response.data.error}`));
            }
            if (error.response.data?.message) {
                console.error(chalk_1.default.red(`  Details: ${error.response.data.message}`));
            }
            console.log(chalk_1.default.gray(`  URL: ${error.config?.url}`));
            if (error.response.status === 401) {
                console.log(chalk_1.default.cyan('\n  🔐 Authentication required.'));
                console.log(chalk_1.default.cyan('     Run: mz login'));
            }
            else if (error.response.status === 403) {
                console.log(chalk_1.default.cyan('\n  🚫 Insufficient permissions.'));
                console.log(chalk_1.default.cyan('     Your API key may not have "api:keys:read" permission.'));
            }
            else if (error.response.status === 404) {
                console.log(chalk_1.default.cyan('\n  🔍 Endpoint not found.'));
                console.log(chalk_1.default.cyan('     Check API URL: ' + error.config?.url));
                console.log(chalk_1.default.cyan('     Try: mz config --set apiUrl=http://localhost:3000/api/v1'));
            }
        }
        else if (error.code === 'ECONNREFUSED') {
            console.error(chalk_1.default.red('  Cannot connect to API server'));
            console.log(chalk_1.default.cyan('  → Is the server running?'));
            console.log(chalk_1.default.cyan('  → Check URL: ' + await (0, auth_1.buildApiUrl)('/keys')));
        }
        else if (error.code === 'ETIMEDOUT') {
            console.error(chalk_1.default.red('  Request timeout'));
            console.log(chalk_1.default.cyan('  → The server is taking too long to respond'));
        }
        else {
            console.error(chalk_1.default.red(`  Error: ${error.message}`));
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('\n💡 Quick Fixes:'));
        console.log(chalk_1.default.cyan('  1. Check server: curl ' + await (0, auth_1.buildApiUrl)('/keys')));
        console.log(chalk_1.default.cyan('  2. Set correct URL: mz config --set apiUrl=http://localhost:3000/api/v1'));
        console.log(chalk_1.default.cyan('  3. Verify login: mz whoami\n'));
    }
}
