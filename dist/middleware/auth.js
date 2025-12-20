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
exports.requireAuth = requireAuth;
exports.getAuthHeaders = getAuthHeaders;
exports.buildApiUrl = buildApiUrl;
exports.getApiUserInfo = getApiUserInfo;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../utils/config");
const axios_1 = __importDefault(require("axios"));
async function requireAuth(silent = false) {
    try {
        const apiKey = await (0, config_1.getApiKey)();
        const apiUrl = await (0, config_1.getApiUrl)();
        if (!silent) {
            console.log(chalk_1.default.gray(`   Debug: API URL: ${apiUrl}`));
        }
        if (!apiKey) {
            if (!silent) {
                console.log(chalk_1.default.yellow('\n⚠️  You are not logged in.'));
                console.log(chalk_1.default.cyan('   Run: mz login'));
                console.log(chalk_1.default.cyan(`   API URL: ${apiUrl}`));
                console.log(chalk_1.default.cyan('   Or set MGZON_API_KEY environment variable\n'));
                const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
                const { proceed } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'proceed',
                        message: 'Continue without authentication?',
                        default: false
                    }
                ]);
                if (!proceed) {
                    process.exit(0);
                }
            }
            return null;
        }
        try {
            if (!silent) {
                console.log(chalk_1.default.gray(`   Debug: Verifying API key via CLI login endpoint`));
            }
            const response = await axios_1.default.post(`${apiUrl}/cli/auth/login`, {
                apiKey
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            if (response.data.success) {
                return {
                    apiKey,
                    apiUrl,
                    user: response.data.data.user,
                    rateLimit: response.data.data.apiKey?.rateLimit
                };
            }
            else {
                throw new Error(response.data.error || 'API key verification failed');
            }
        }
        catch (error) {
            if (!silent) {
                console.log(chalk_1.default.red('\n❌ Authentication failed!'));
                if (error.response?.status === 401) {
                    console.log(chalk_1.default.cyan(`   Invalid API key. Please login again.`));
                }
                else {
                    console.log(chalk_1.default.cyan(`   Error: ${error.message || 'Unknown error'}`));
                }
                console.log(chalk_1.default.cyan('\n   Run: mz login to re-authenticate'));
                const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
                const { relogin } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'relogin',
                        message: 'Login now?',
                        default: true
                    }
                ]);
                if (relogin) {
                    const { loginCommand } = await Promise.resolve().then(() => __importStar(require('../commands/login')));
                    await loginCommand({});
                    const newApiKey = await (0, config_1.getApiKey)();
                    const config = await (0, config_1.getConfig)();
                    return {
                        apiKey: newApiKey,
                        apiUrl: config.apiUrl || apiUrl
                    };
                }
            }
            throw error;
        }
    }
    catch (error) {
        if (!silent) {
            console.error(chalk_1.default.red('Auth error:'), error.message);
            console.log(chalk_1.default.gray(`   Current API URL: ${await (0, config_1.getApiUrl)()}`));
            console.log(chalk_1.default.cyan('   Try: mz config --set apiUrl=http://localhost:3000/api/v1'));
        }
        throw error;
    }
}
async function getAuthHeaders() {
    const auth = await requireAuth(true);
    if (!auth) {
        throw new Error('Not authenticated');
    }
    return {
        'Authorization': `Bearer ${auth.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': `mgzon-cli/1.0.0 (${process.platform}; ${process.arch})`,
        'X-CLI-Version': '1.0.0'
    };
}
async function buildApiUrl(endpoint) {
    const apiUrl = await (0, config_1.getApiUrl)();
    const fullUrl = `${apiUrl}${endpoint}`;
    console.log(chalk_1.default.gray(`   Debug: Building API URL: ${fullUrl}`));
    return fullUrl;
}
async function getApiUserInfo() {
    const auth = await requireAuth(true);
    if (!auth) {
        throw new Error('Not authenticated');
    }
    const response = await axios_1.default.post(`${auth.apiUrl}/cli/auth/login`, {
        apiKey: auth.apiKey
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data.data.user;
}
