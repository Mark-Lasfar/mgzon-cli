"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
exports.getApiKey = getApiKey;
exports.getApiUrl = getApiUrl;
exports.loginCommand = loginCommand;
exports.verifyApiKey = verifyApiKey;
exports.logout = logout;
exports.isAuthenticated = isAuthenticated;
exports.getUserInfo = getUserInfo;
exports.getCurrentProject = getCurrentProject;
exports.setCurrentProject = setCurrentProject;
exports.clearCurrentProject = clearCurrentProject;
exports.getProjectConfig = getProjectConfig;
exports.saveProjectConfig = saveProjectConfig;
exports.checkForUpdates = checkForUpdates;
const os_1 = require("os");
const path_1 = require("path");
const fs_extra_1 = __importDefault(require("fs-extra"));
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const CONFIG_DIR = (0, path_1.join)((0, os_1.homedir)(), '.mgzon');
const CONFIG_FILE = (0, path_1.join)(CONFIG_DIR, 'config.json');
const API_URLS = {
    development: 'http://localhost:3000/api/v1',
    staging: 'https://staging.api.mgzon.com/v1',
    production: 'https://api.mgzon.com/v1'
};
async function getConfig() {
    try {
        await fs_extra_1.default.ensureDir(CONFIG_DIR);
        if (await fs_extra_1.default.pathExists(CONFIG_FILE)) {
            const config = await fs_extra_1.default.readJson(CONFIG_FILE);
            return config;
        }
        const defaultConfig = {
            apiUrl: API_URLS.production,
            defaultEnvironment: 'production',
            theme: 'default'
        };
        await fs_extra_1.default.writeJson(CONFIG_FILE, defaultConfig, { spaces: 2 });
        return defaultConfig;
    }
    catch (error) {
        console.error('Error reading config:', error);
        return {};
    }
}
async function saveConfig(config) {
    try {
        const currentConfig = await getConfig();
        const newConfig = { ...currentConfig, ...config };
        await fs_extra_1.default.ensureDir(CONFIG_DIR);
        await fs_extra_1.default.writeJson(CONFIG_FILE, newConfig, { spaces: 2 });
        return newConfig;
    }
    catch (error) {
        console.error('Failed to save config:', error);
        throw error;
    }
}
async function getApiKey() {
    if (process.env.MGZON_API_KEY) {
        return process.env.MGZON_API_KEY;
    }
    const config = await getConfig();
    return config.apiKey;
}
async function getApiUrl() {
    const config = await getConfig();
    return config.apiUrl || API_URLS.production;
}
async function loginCommand(apiKey) {
    try {
        const apiUrl = await getApiUrl();
        const response = await axios_1.default.post(`${apiUrl}/cli/auth/login`, {
            apiKey
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        if (!response.data.success) {
            throw new Error(response.data.error || 'Login failed');
        }
        const { user, apiKey: keyInfo, session } = response.data.data;
        await saveConfig({
            apiKey,
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
            throw new Error('Cannot connect to MGZON API. Check your network connection.');
        }
        else if (error.response?.status === 401) {
            throw new Error('Invalid API key. Please check your key and try again.');
        }
        else if (error.response?.status === 403) {
            throw new Error('API key has insufficient permissions.');
        }
        else if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        else {
            throw new Error(`Login failed: ${error.message}`);
        }
    }
}
async function verifyApiKey(apiKey) {
    try {
        const apiUrl = await getApiUrl();
        const response = await axios_1.default.post(`${apiUrl}/auth/verify`, {}, {
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
        throw error;
    }
}
async function logout() {
    const config = await getConfig();
    if (config.apiKey) {
        try {
            const apiUrl = await getApiUrl();
            await axios_1.default.post(`${apiUrl}/auth/logout`, {}, {
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
        refreshToken: undefined,
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
        isAdmin: config.isAdmin
    };
}
async function getCurrentProject() {
    const config = await getConfig();
    return config.currentProject || null;
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
            console.log(chalk_1.default.yellow('\n⚠️  Update available!'));
            console.log(chalk_1.default.cyan(`   Current: ${currentVersion}`));
            console.log(chalk_1.default.cyan(`   Latest: ${latestVersion}`));
            console.log(chalk_1.default.cyan('   Run: npm install -g @mgzon/cli\n'));
        }
    }
    catch (error) {
    }
}
//# sourceMappingURL=config.js.map