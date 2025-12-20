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
exports.whoamiCommand = whoamiCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../utils/config");
const axios_1 = __importDefault(require("axios"));
async function whoamiCommand() {
    try {
        const config = await (0, config_1.getConfig)();
        const apiKey = await (0, config_1.getApiKey)();
        const apiUrl = await (0, config_1.getApiUrl)();
        console.log(chalk_1.default.gray(`   Debug: API URL: ${apiUrl}`));
        if (!apiKey) {
            console.log(chalk_1.default.yellow('\n' + '─'.repeat(50)));
            console.log(chalk_1.default.yellow('⚠️  You are not logged in.'));
            console.log(chalk_1.default.yellow('─'.repeat(50)));
            console.log(chalk_1.default.cyan('   Run: mz login to authenticate'));
            console.log(chalk_1.default.cyan(`   Current API URL: ${apiUrl}`));
            console.log(chalk_1.default.cyan('   Or set MGZON_API_KEY environment variable\n'));
            return;
        }
        console.log(chalk_1.default.cyan('\n' + '═'.repeat(50)));
        console.log(chalk_1.default.bold.cyan('👤 Your Account Information'));
        console.log(chalk_1.default.cyan('═'.repeat(50)));
        const userInfo = await (0, config_1.getUserInfo)();
        if (userInfo.email) {
            console.log(chalk_1.default.green('✅ You are logged in:'));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            console.log(chalk_1.default.cyan(`   👤 Name: ${userInfo.name || 'Not available'}`));
            console.log(chalk_1.default.cyan(`   📧 Email: ${userInfo.email}`));
            console.log(chalk_1.default.cyan(`   🆔 User ID: ${userInfo.userId ? userInfo.userId.substring(0, 8) + '...' : 'Not available'}`));
            console.log(chalk_1.default.cyan(`   🎯 Role: ${userInfo.role || 'Developer'}`));
            if (userInfo.isDeveloper) {
                console.log(chalk_1.default.cyan('   🛠️  Type: Developer'));
            }
            if (userInfo.isSeller) {
                console.log(chalk_1.default.cyan('   🏪 Type: Seller'));
            }
            if (userInfo.isAdmin) {
                console.log(chalk_1.default.cyan('   🔧 Type: Admin'));
            }
            console.log(chalk_1.default.gray('─'.repeat(40)));
        }
        else {
            console.log(chalk_1.default.yellow('⚠️  No user info found in config'));
        }
        console.log(chalk_1.default.gray('─'.repeat(40)));
        console.log(chalk_1.default.cyan(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`));
        console.log(chalk_1.default.cyan(`🌐 API URL: ${apiUrl}`));
        if (config.lastLogin) {
            console.log(chalk_1.default.cyan(`📅 Last login: ${new Date(config.lastLogin).toLocaleString()}`));
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('\n📊 Live API Status:'));
        console.log(chalk_1.default.gray('─'.repeat(40)));
        try {
            console.log(chalk_1.default.gray(`   Debug: Verifying API key at: ${apiUrl}/auth/verify`));
            const response = await axios_1.default.post(`${apiUrl}/auth/verify`, {}, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            if (response.data.success) {
                console.log(chalk_1.default.green('   ✓ API Key Verified: ✅'));
                const userData = response.data.data?.user;
                const keyData = response.data.data?.key;
                if (userData) {
                    console.log(chalk_1.default.cyan(`   👤 Live Name: ${userData.name || userData.email}`));
                    console.log(chalk_1.default.cyan(`   🎯 Live Role: ${userData.role || userData.type || 'Unknown'}`));
                }
                if (keyData) {
                    console.log(chalk_1.default.cyan(`   🔑 Key Name: ${keyData.name || 'Unnamed'}`));
                    console.log(chalk_1.default.cyan(`   🔧 Key Type: ${keyData.type || 'Unknown'}`));
                    console.log(chalk_1.default.cyan(`   📋 Permissions: ${keyData.permissions?.length || 0} permission(s)`));
                    if (keyData.expiresAt) {
                        const expiresDate = new Date(keyData.expiresAt);
                        const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const color = daysLeft < 7 ? 'red' : daysLeft < 30 ? 'yellow' : 'green';
                        console.log(chalk_1.default[color](`   ⏳ Expires in: ${daysLeft} days`));
                    }
                    else {
                        console.log(chalk_1.default.green(`   ∞ Expires: Never`));
                    }
                }
                if (response.data.data?.rateLimit) {
                    const rateLimit = response.data.data.rateLimit;
                    console.log(chalk_1.default.cyan(`   🚦 Rate Limit: ${rateLimit.remaining || '?'}/${rateLimit.limits?.minute || '?'}`));
                }
            }
            else {
                console.log(chalk_1.default.yellow('   ⚠️ API Key verification failed'));
                console.log(chalk_1.default.red(`   Error: ${response.data.error || 'Unknown error'}`));
            }
        }
        catch (error) {
            console.log(chalk_1.default.red('   ❌ Cannot verify with API'));
            if (error.code === 'ECONNREFUSED') {
                console.log(chalk_1.default.yellow(`   ⚠️  Connection refused at: ${apiUrl}`));
                console.log(chalk_1.default.cyan(`   💡 Check if server is running: http://localhost:3000`));
            }
            else if (error.response?.status === 401) {
                console.log(chalk_1.default.red(`   🔐 API key is invalid or expired`));
                console.log(chalk_1.default.cyan(`   💡 Run: mz login to get a new key`));
            }
            else if (error.message) {
                console.log(chalk_1.default.red(`   Error: ${error.message}`));
            }
            console.log(chalk_1.default.gray(`   Debug URL: ${apiUrl}/auth/verify`));
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        try {
            const { testApiConnection } = await Promise.resolve().then(() => __importStar(require('../utils/config')));
            const testResult = await testApiConnection();
            console.log(chalk_1.default.cyan('\n🌐 Connection Test:'));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            if (testResult.success) {
                console.log(chalk_1.default.green('   ✓ API Server: Reachable ✅'));
                console.log(chalk_1.default.cyan(`   📍 URL: ${testResult.url}`));
            }
            else {
                console.log(chalk_1.default.red('   ❌ API Server: Unreachable'));
                console.log(chalk_1.default.yellow(`   ⚠️  URL: ${testResult.url}`));
                if (testResult.error) {
                    console.log(chalk_1.default.red(`   Error: ${testResult.error}`));
                }
            }
        }
        catch (testError) {
            console.log(chalk_1.default.red('   ❌ Connection test failed'));
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('\n⚙️  Configuration:'));
        console.log(chalk_1.default.gray('─'.repeat(40)));
        console.log(chalk_1.default.cyan(`   Config file: ~/.mgzon/config.json`));
        console.log(chalk_1.default.cyan(`   API URL: ${apiUrl}`));
        console.log(chalk_1.default.cyan(`   Environment: ${config.defaultEnvironment || 'development'}`));
        console.log(chalk_1.default.cyan(`   Current project: ${config.currentProject || 'None'}`));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('\n💡 Tips:'));
        console.log(chalk_1.default.gray('─'.repeat(40)));
        console.log(chalk_1.default.yellow('   mz login                 # Re-authenticate'));
        console.log(chalk_1.default.yellow('   mz config --list         # View all settings'));
        console.log(chalk_1.default.yellow('   mz config --get apiUrl   # Check current API URL'));
        console.log(chalk_1.default.yellow('   mz apps --list           # List your apps'));
        console.log(chalk_1.default.yellow('   mz keys --list           # List API keys'));
        console.log(chalk_1.default.gray('─'.repeat(40)));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n' + '─'.repeat(50)));
        console.error(chalk_1.default.bold.red('❌ Error fetching user information:'));
        console.error(chalk_1.default.red('─'.repeat(50)));
        console.error(chalk_1.default.red(`   ${error.message}`));
        if (error.code === 'ECONNREFUSED') {
            console.log(chalk_1.default.cyan('\n🔧 Troubleshooting:'));
            console.log(chalk_1.default.cyan('   1. Check if MGZON API server is running'));
            console.log(chalk_1.default.cyan('      Run: curl http://localhost:3000/api/v1/health'));
            console.log(chalk_1.default.cyan('   2. Check API URL configuration:'));
            console.log(chalk_1.default.cyan('      mz config --get apiUrl'));
            console.log(chalk_1.default.cyan('   3. Set correct API URL:'));
            console.log(chalk_1.default.cyan('      mz config --set apiUrl=http://localhost:3000/api/v1'));
        }
        console.log(chalk_1.default.red('─'.repeat(50)));
    }
}
