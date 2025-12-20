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
exports.logoutCommand = logoutCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../utils/config");
async function logoutCommand() {
    const spinner = (0, ora_1.default)('Logging out...').start();
    try {
        const userInfo = await (0, config_1.getUserInfo)();
        const apiUrl = await (0, config_1.getApiUrl)();
        console.log(chalk_1.default.gray(`   Debug: Logging out from: ${apiUrl}`));
        if (userInfo.email) {
            console.log(chalk_1.default.gray(`   User: ${userInfo.email}`));
        }
        await (0, config_1.logout)();
        spinner.succeed(chalk_1.default.green('✅ Logged out successfully!'));
        console.log(chalk_1.default.cyan('\n' + '─'.repeat(50)));
        console.log(chalk_1.default.green('🔒 Logout Successful'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        if (userInfo.email) {
            console.log(chalk_1.default.cyan(`   User: ${userInfo.email}`));
        }
        if (userInfo.name) {
            console.log(chalk_1.default.cyan(`   Name: ${userInfo.name}`));
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.yellow('\n💡 Information:'));
        console.log(chalk_1.default.cyan('   ✓ API key cleared from local storage'));
        console.log(chalk_1.default.cyan('   ✓ Session tokens removed'));
        console.log(chalk_1.default.cyan('   ✓ User data cleared'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.yellow('\n🚀 Next Steps:'));
        console.log(chalk_1.default.cyan('   To login again: mz login'));
        console.log(chalk_1.default.cyan('   Or use: mz login --api-key="YOUR_API_KEY"'));
        console.log(chalk_1.default.cyan('   Get API keys: https://mgzon.com/developers\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Logout failed'));
        console.log(chalk_1.default.red('\n' + '─'.repeat(50)));
        console.log(chalk_1.default.bold.red('Logout Error'));
        console.log(chalk_1.default.red('─'.repeat(50)));
        console.error(chalk_1.default.red(`   ${error.message}`));
        console.log(chalk_1.default.gray('\n' + '─'.repeat(50)));
        console.log(chalk_1.default.yellow('🔧 Troubleshooting:'));
        if (error.message.includes('ECONNREFUSED')) {
            console.log(chalk_1.default.cyan('   1. Check if MGZON API server is running'));
            console.log(chalk_1.default.cyan('   2. Verify network connection'));
            console.log(chalk_1.default.cyan('   3. Try: mz config --get apiUrl'));
        }
        else if (error.message.includes('Cannot connect')) {
            console.log(chalk_1.default.cyan('   1. Current API URL: ' + (await (0, config_1.getApiUrl)().catch(() => 'Unknown'))));
            console.log(chalk_1.default.cyan('   2. Try: mz config --set apiUrl=http://localhost:3000/api/v1'));
            console.log(chalk_1.default.cyan('   3. Then: mz logout'));
        }
        else {
            console.log(chalk_1.default.cyan('   1. Clear local config manually:'));
            console.log(chalk_1.default.cyan('      rm ~/.mgzon/config.json'));
            console.log(chalk_1.default.cyan('   2. Set environment variable:'));
            console.log(chalk_1.default.cyan('      unset MGZON_API_KEY'));
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        try {
            const { saveConfig } = await Promise.resolve().then(() => __importStar(require('../utils/config')));
            await saveConfig({
                apiKey: undefined,
                userId: undefined,
                email: undefined,
                name: undefined,
                role: undefined,
                isDeveloper: undefined,
                isSeller: undefined,
                isAdmin: undefined,
                sessionToken: undefined,
                expiresAt: undefined
            });
            console.log(chalk_1.default.yellow('\n⚠️  Local config cleared.'));
            console.log(chalk_1.default.cyan('   You can now login again.\n'));
        }
        catch (fallbackError) {
            console.error(chalk_1.default.red('   Could not clear local config:', fallbackError.message));
        }
    }
}
//# sourceMappingURL=logout.js.map