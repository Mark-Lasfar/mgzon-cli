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
        const headers = await (0, auth_1.getAuthHeaders)();
        if (options.list) {
            spinner.text = 'Fetching API keys...';
            const response = await axios_1.default.get(await (0, auth_1.buildApiUrl)('/keys'), { headers });
            const keys = response.data.data?.apiKeys || response.data.keys || [];
            spinner.succeed(chalk_1.default.green(`✅ Found ${keys.length} API key(s)`));
            console.log(chalk_1.default.cyan('\n🔑 API Keys\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            if (keys.length === 0) {
                console.log(chalk_1.default.yellow('No API keys found. Generate one with: mz keys --generate'));
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
            const response = await axios_1.default.post(await (0, auth_1.buildApiUrl)('/keys'), {
                name: keyName,
                type: keyType,
                permissions: ['products:read', 'orders:read', 'apps:read', 'apps:write', 'api:keys:read'],
                expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
            }, { headers });
            const newKey = response.data.data || response.data;
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
            return;
        }
        if (options.revoke) {
            spinner.text = 'Revoking API key...';
            await axios_1.default.delete(await (0, auth_1.buildApiUrl)(`/keys/${options.revoke}`), { headers });
            spinner.succeed(chalk_1.default.green(`✅ API key ${options.revoke} revoked successfully`));
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
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Keys command failed'));
        if (error.response) {
            console.error(chalk_1.default.red(`  Error ${error.response.status}: ${error.response.data.error || error.response.data.message || 'API error'}`));
        }
        else {
            console.error(chalk_1.default.red(`  Error: ${error.message}`));
        }
    }
}
//# sourceMappingURL=keys.js.map