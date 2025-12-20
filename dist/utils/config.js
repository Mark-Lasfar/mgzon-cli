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
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
exports.getApiUrl = getApiUrl;
exports.autoDetectConnection = autoDetectConnection;
exports.setupWizard = setupWizard;
exports.loginCommand = loginCommand;
exports.getApiKey = getApiKey;
exports.getBaseUrl = getBaseUrl;
exports.verifyApiKey = verifyApiKey;
exports.testApiConnection = testApiConnection;
exports.logout = logout;
exports.isAuthenticated = isAuthenticated;
exports.getUserInfo = getUserInfo;
exports.getCurrentProject = getCurrentProject;
exports.setCurrentProject = setCurrentProject;
exports.clearCurrentProject = clearCurrentProject;
exports.getProjectConfig = getProjectConfig;
exports.saveProjectConfig = saveProjectConfig;
exports.checkForUpdates = checkForUpdates;
exports.validateApiEndpoints = validateApiEndpoints;
exports.testAllEndpoints = testAllEndpoints;
const os_1 = require("os");
const path_1 = require("path");
const fs_extra_1 = __importDefault(require("fs-extra"));
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const CONFIG_DIR = (0, path_1.join)((0, os_1.homedir)(), '.mgzon');
const CONFIG_FILE = (0, path_1.join)(CONFIG_DIR, 'config.json');
async function determineBestApiUrl() {
    try {
        console.log(chalk_1.default.gray('   🔍 Auto-detecting best API URL...'));
        const testUrls = [
            { name: 'localhost', url: 'http://localhost:3000/api/v1' },
            { name: 'ngrok', url: 'https://75ed3a070bbc.ngrok-free.app/api/v1' },
            { name: 'local IP', url: 'http://192.168.1.4:3000/api/v1' },
        ];
        for (const test of testUrls) {
            try {
                console.log(chalk_1.default.gray(`   Testing ${test.name}: ${test.url}`));
                const response = await axios_1.default.get(`${test.url}/health`, { timeout: 3000 });
                if (response.status === 200) {
                    console.log(chalk_1.default.green(`   ✅ ${test.name} is reachable`));
                    return test.url;
                }
            }
            catch (error) {
                console.log(chalk_1.default.yellow(`   ❌ ${test.name} not reachable`));
            }
        }
        console.log(chalk_1.default.gray('   ⚠️  No reachable URLs found, using default'));
        return 'http://localhost:3000/api/v1';
    }
    catch (error) {
        console.log(chalk_1.default.gray('   ⚠️  Error determining best URL, using localhost'));
        return 'http://localhost:3000/api/v1';
    }
}
async function getConfig() {
    try {
        await fs_extra_1.default.ensureDir(CONFIG_DIR);
        if (await fs_extra_1.default.pathExists(CONFIG_FILE)) {
            const config = await fs_extra_1.default.readJson(CONFIG_FILE);
            return config;
        }
        const bestUrl = await determineBestApiUrl();
        const defaultConfig = {
            apiUrl: bestUrl,
            defaultEnvironment: 'development',
            theme: 'default',
            useLocalhost: bestUrl.includes('localhost'),
            useNgrok: bestUrl.includes('ngrok')
        };
        await fs_extra_1.default.writeJson(CONFIG_FILE, defaultConfig, { spaces: 2 });
        return defaultConfig;
    }
    catch (error) {
        console.error('Error reading config:', error);
        return {
            apiUrl: 'http://localhost:3000/api/v1',
            useLocalhost: false,
            useNgrok: false
        };
    }
}
async function saveConfig(config) {
    try {
        const currentConfig = await getConfig();
        const newConfig = { ...currentConfig, ...config };
        if (newConfig.apiUrl) {
            if (newConfig.apiUrl.includes('ngrok')) {
                newConfig.useNgrok = true;
                newConfig.useLocalhost = false;
                newConfig.ngrokUrl = newConfig.apiUrl.replace('/api/v1', '');
            }
            else if (newConfig.apiUrl.includes('localhost')) {
                newConfig.useLocalhost = true;
                newConfig.useNgrok = false;
                newConfig.ngrokUrl = undefined;
            }
        }
        await fs_extra_1.default.ensureDir(CONFIG_DIR);
        await fs_extra_1.default.writeJson(CONFIG_FILE, newConfig, { spaces: 2 });
        if (newConfig.apiUrl && newConfig.apiUrl !== currentConfig.apiUrl) {
            console.log(chalk_1.default.gray('\n   ⚙️  Configuration updated:'));
            console.log(chalk_1.default.cyan(`     API URL: ${newConfig.apiUrl}`));
            console.log(chalk_1.default.cyan(`     Mode: ${newConfig.useNgrok ? 'Ngrok (Remote)' : 'Localhost (Local)'}`));
        }
        return newConfig;
    }
    catch (error) {
        console.error('Failed to save config:', error);
        throw error;
    }
}
async function getApiUrl() {
    const config = await getConfig();
    if (process.env.MGZON_API_URL) {
        console.log(chalk_1.default.gray(`   Using MGZON_API_URL from env: ${process.env.MGZON_API_URL}`));
        return process.env.MGZON_API_URL;
    }
    if (!config.apiUrl) {
        const bestUrl = await determineBestApiUrl();
        await saveConfig({ apiUrl: bestUrl });
        return bestUrl;
    }
    return config.apiUrl;
}
async function autoDetectConnection() {
    console.log(chalk_1.default.gray('   🔍 Auto-detecting connection...'));
    const testUrls = [
        { type: 'localhost', url: 'http://localhost:3000/api/v1' },
        { type: 'ngrok', url: 'https://75ed3a070bbc.ngrok-free.app/api/v1' },
        { type: 'ip', url: 'http://192.168.1.4:3000/api/v1' },
    ];
    for (const test of testUrls) {
        try {
            console.log(chalk_1.default.gray(`   Testing ${test.type}: ${test.url}`));
            const response = await axios_1.default.get(`${test.url}/health`, { timeout: 5000 });
            if (response.status === 200) {
                console.log(chalk_1.default.green(`   ✅ ${test.type} is reachable`));
                return {
                    type: test.type,
                    url: test.url,
                    reachable: true
                };
            }
        }
        catch (error) {
            console.log(chalk_1.default.yellow(`   ❌ ${test.type} not reachable`));
        }
    }
    return {
        type: 'unknown',
        url: 'http://localhost:3000/api/v1',
        reachable: false
    };
}
async function setupWizard() {
    console.log(chalk_1.default.cyan('\n' + '═'.repeat(50)));
    console.log(chalk_1.default.bold('🚀 MGZON CLI Setup Wizard'));
    console.log(chalk_1.default.cyan('═'.repeat(50)));
    const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'connectionType',
            message: 'How do you want to connect to MGZON?',
            choices: [
                { name: 'Local development (localhost:3000)', value: 'localhost' },
                { name: 'Ngrok tunnel (remote access)', value: 'ngrok' },
                { name: 'Custom IP/URL', value: 'custom' }
            ],
            default: 'localhost'
        },
        {
            type: 'input',
            name: 'customUrl',
            message: 'Enter your custom API URL:',
            when: (answers) => answers.connectionType === 'custom',
            validate: (input) => {
                if (!input)
                    return 'URL is required';
                try {
                    new URL(input);
                    return true;
                }
                catch {
                    return 'Please enter a valid URL';
                }
            }
        }
    ]);
    let apiUrl;
    switch (answers.connectionType) {
        case 'localhost':
            apiUrl = 'http://localhost:3000/api/v1';
            break;
        case 'ngrok':
            console.log(chalk_1.default.yellow('\n⚠️  Note: You need to run ngrok separately:'));
            console.log(chalk_1.default.cyan('  1. Install ngrok: https://ngrok.com/download'));
            console.log(chalk_1.default.cyan('  2. Run: ngrok http 3000'));
            console.log(chalk_1.default.cyan('  3. Copy the forwarding URL (e.g., https://abc123.ngrok.io)'));
            const { ngrokUrl } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'ngrokUrl',
                    message: 'Enter your ngrok URL (without /api/v1):',
                    validate: (input) => {
                        if (!input)
                            return 'URL is required';
                        try {
                            new URL(input);
                            return true;
                        }
                        catch {
                            return 'Please enter a valid URL';
                        }
                    }
                }
            ]);
            apiUrl = `${ngrokUrl}/api/v1`;
            break;
        case 'custom':
            apiUrl = answers.customUrl;
            break;
        default:
            apiUrl = 'http://localhost:3000/api/v1';
    }
    await saveConfig({ apiUrl });
    console.log(chalk_1.default.green('\n✅ Setup complete!'));
    console.log(chalk_1.default.cyan(`   API URL set to: ${apiUrl}`));
    console.log(chalk_1.default.cyan('\n   Next: mz login\n'));
}
async function loginCommand(apiKey) {
    try {
        const apiUrl = await getApiUrl();
        console.log(chalk_1.default.gray(`   Debug: Login URL: ${apiUrl}/cli/auth/login`));
        let response;
        try {
            response = await axios_1.default.post(`${apiUrl}/cli/auth/login`, {
                apiKey
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
        }
        catch (firstError) {
            console.log(chalk_1.default.yellow('   ⚠️  Connection failed, trying auto-detection...'));
            const bestConnection = await autoDetectConnection();
            if (!bestConnection.reachable) {
                throw firstError;
            }
            console.log(chalk_1.default.gray(`   Debug: Retrying with ${bestConnection.type}: ${bestConnection.url}`));
            response = await axios_1.default.post(`${bestConnection.url}/cli/auth/login`, {
                apiKey
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            await saveConfig({ apiUrl: bestConnection.url });
        }
        if (!response.data.success) {
            throw new Error(response.data.error || 'Login failed');
        }
        const { user, apiKey: keyInfo, session } = response.data.data;
        await saveConfig({
            apiKey: apiKey,
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isDeveloper: user.isDeveloper || false,
            isSeller: user.isSeller || false,
            isAdmin: user.isAdmin || false,
            sessionToken: session?.token,
            expiresAt: session?.expiresAt,
            lastLogin: new Date().toISOString()
        });
        return user;
    }
    catch (error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error(`Cannot connect to MGZON API at ${await getApiUrl()}. Is the server running?`);
        }
        else if (error.response?.status === 401) {
            throw new Error('Invalid API key.');
        }
        else if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        else {
            throw new Error(`Login failed: ${error.message}`);
        }
    }
}
async function getApiKey() {
    if (process.env.MGZON_API_KEY) {
        console.log(chalk_1.default.gray('   Using MGZON_API_KEY from environment variable'));
        return process.env.MGZON_API_KEY;
    }
    const config = await getConfig();
    return config.apiKey;
}
async function getBaseUrl() {
    const apiUrl = await getApiUrl();
    return apiUrl.replace('/api/v1', '');
}
async function verifyApiKey(apiKey) {
    try {
        const baseUrl = await getBaseUrl();
        const response = await axios_1.default.post(`${baseUrl}/api/v1/auth/verify`, {}, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        return response.data;
    }
    catch (error) {
        if (error.response?.status === 401) {
            throw new Error('Invalid API key');
        }
        else if (error.code === 'ECONNREFUSED') {
            throw new Error('Cannot connect to API server. Check if server is running.');
        }
        throw error;
    }
}
async function testApiConnection() {
    try {
        const apiUrl = await getApiUrl();
        const healthUrl = apiUrl.replace('/api/v1', '/api/v1/health');
        const response = await axios_1.default.get(healthUrl, { timeout: 5000 });
        return {
            success: response.data.success || true,
            url: healthUrl
        };
    }
    catch (error) {
        return {
            success: false,
            url: await getApiUrl(),
            error: error.message
        };
    }
}
async function logout() {
    const config = await getConfig();
    if (config.apiKey) {
        try {
            const baseUrl = await getBaseUrl();
            await axios_1.default.post(`${baseUrl}/api/v1/auth/logout`, {}, {
                headers: { 'Authorization': `Bearer ${config.apiKey}` }
            });
        }
        catch (error) {
            console.warn(chalk_1.default.yellow('Warning: Could not logout from API server'));
        }
    }
    return saveConfig({
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
}
async function isAuthenticated() {
    const apiKey = await getApiKey();
    return !!apiKey;
}
async function getUserInfo() {
    const config = await getConfig();
    return {
        email: config.email,
        name: config.name,
        userId: config.userId,
        role: config.role,
        isDeveloper: config.isDeveloper,
        isSeller: config.isSeller,
        isAdmin: config.isAdmin,
        apiUrl: config.apiUrl
    };
}
async function getCurrentProject() {
    const config = await getConfig();
    if (!config.currentProject) {
        return null;
    }
    const valid = await fs_extra_1.default.pathExists(config.currentProject);
    return {
        path: config.currentProject,
        valid
    };
}
async function setCurrentProject(projectPath) {
    await saveConfig({ currentProject: projectPath });
}
async function clearCurrentProject() {
    await saveConfig({ currentProject: undefined });
}
async function getProjectConfig(projectPath) {
    const projectConfigFile = (0, path_1.join)(projectPath, '.mgzon.json');
    if (await fs_extra_1.default.pathExists(projectConfigFile)) {
        return await fs_extra_1.default.readJson(projectConfigFile);
    }
    return {};
}
async function saveProjectConfig(projectPath, config) {
    const projectConfigFile = (0, path_1.join)(projectPath, '.mgzon.json');
    await fs_extra_1.default.writeJson(projectConfigFile, config, { spaces: 2 });
}
async function checkForUpdates() {
    try {
        const response = await axios_1.default.get('https://registry.npmjs.org/@mgzon/cli/latest', {
            timeout: 3000
        });
        const currentVersion = require('../../package.json').version;
        const latestVersion = response.data.version;
        if (currentVersion !== latestVersion) {
            console.log(chalk_1.default.yellow('\n' + '─'.repeat(50)));
            console.log(chalk_1.default.yellow('⚠️  Update available!'));
            console.log(chalk_1.default.cyan(`   Current: ${currentVersion}`));
            console.log(chalk_1.default.cyan(`   Latest: ${latestVersion}`));
            console.log(chalk_1.default.cyan('   Run: npm install -g @mgzon/cli'));
            console.log(chalk_1.default.yellow('─'.repeat(50) + '\n'));
        }
    }
    catch (error) {
    }
}
async function validateApiEndpoints() {
    const apiUrl = await getApiUrl();
    return {
        health: `${apiUrl}/health`,
        webhooks: `${apiUrl}/webhooks`,
        apps: `${apiUrl}/apps`,
        auth: `${apiUrl}/auth/verify`
    };
}
async function testAllEndpoints() {
    const endpoints = await validateApiEndpoints();
    const results = {};
    for (const [name, url] of Object.entries(endpoints)) {
        try {
            const response = await axios_1.default.get(url, { timeout: 3000 });
            results[name] = response.status === 200;
        }
        catch (error) {
            results[name] = false;
        }
    }
    return results;
}
//# sourceMappingURL=config.js.map