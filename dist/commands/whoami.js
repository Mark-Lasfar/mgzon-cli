"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoamiCommand = whoamiCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../utils/config");
const axios_1 = __importDefault(require("axios"));
async function whoamiCommand() {
    try {
        const config = await (0, config_1.getConfig)();
        const apiKey = await (0, config_1.getApiKey)();
        if (!apiKey) {
            console.log(chalk_1.default.yellow('\n⚠️  You are not logged in.'));
            console.log(chalk_1.default.cyan('   Run: mz login to authenticate\n'));
            return;
        }
        console.log(chalk_1.default.cyan('\n👤 Your Account Information\n'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        if (config.name || config.email) {
            console.log(chalk_1.default.green(`Name:  ${config.name || 'Not set'}`));
            console.log(chalk_1.default.green(`Email: ${config.email || 'Not set'}`));
            console.log(chalk_1.default.green(`Role:  ${config.role || 'Not set'}`));
            console.log(chalk_1.default.green(`User ID: ${config.userId ? config.userId.substring(0, 8) + '...' : 'Not set'}`));
            console.log(chalk_1.default.gray('─'.repeat(50)));
        }
        console.log(chalk_1.default.green(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`));
        console.log(chalk_1.default.green(`API URL: ${await (0, config_1.getApiUrl)()}`));
        if (config.lastLogin) {
            console.log(chalk_1.default.green(`Last login: ${new Date(config.lastLogin).toLocaleString()}`));
        }
        console.log(chalk_1.default.gray('\n─'.repeat(50)));
        try {
            const apiUrl = await (0, config_1.getApiUrl)();
            const response = await axios_1.default.get(`${apiUrl}/api/v1/auth/verify`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (response.data.data?.user) {
                const user = response.data.data.user;
                console.log(chalk_1.default.cyan('\n📊 Live API Status:'));
                console.log(chalk_1.default.green(`  Verified: ✅`));
                console.log(chalk_1.default.green(`  Permissions: ${response.data.data.key?.permissions?.length || 0} permission(s)`));
                if (response.data.data.rateLimit) {
                    console.log(chalk_1.default.green(`  Rate Limit: ${response.data.data.rateLimit.remaining}/${response.data.data.rateLimit.limits.minute}`));
                }
            }
        }
        catch (error) {
            console.log(chalk_1.default.yellow('\n⚠️  Cannot verify with API (might be offline)'));
        }
        console.log(chalk_1.default.gray('\n─'.repeat(50)));
        console.log(chalk_1.default.cyan('\n💡 Tips:'));
        console.log(chalk_1.default.gray('  mz login            # Re-authenticate'));
        console.log(chalk_1.default.gray('  mz config --list    # View all settings\n'));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Error fetching user information:'));
        console.error(chalk_1.default.red(`  ${error.message}`));
    }
}
//# sourceMappingURL=whoami.js.map