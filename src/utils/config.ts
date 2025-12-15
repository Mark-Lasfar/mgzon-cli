import { homedir } from 'os';
import { join } from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import chalk from 'chalk';

const CONFIG_DIR = join(homedir(), '.mgzon');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface CliConfig {
  apiKey?: string;
  apiUrl?: string;
  defaultEnvironment?: 'development' | 'staging' | 'production'| 'sandbox';
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  isDeveloper?: boolean;
  isSeller?: boolean;
  isAdmin?: boolean;
  theme?: string;
  editor?: string;
  currentProject?: string;
  lastLogin?: string;
  sessionToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

// API URLs based on environment
const API_URLS = {
  development: 'http://localhost:3000/api/v1',
  staging: 'https://staging.api.mgzon.com/v1',
  production: 'https://api.mgzon.com/v1'
};

export async function getConfig(): Promise<CliConfig> {
  try {
    await fs.ensureDir(CONFIG_DIR);
    
    if (await fs.pathExists(CONFIG_FILE)) {
      const config = await fs.readJson(CONFIG_FILE);
      return config;
    }
    
    const defaultConfig: CliConfig = {
      apiUrl: API_URLS.production,
      defaultEnvironment: 'production',
      theme: 'default'
    };
    
    await fs.writeJson(CONFIG_FILE, defaultConfig, { spaces: 2 });
    return defaultConfig;
  } catch (error) {
    console.error('Error reading config:', error);
    return {};
  }
}

export async function saveConfig(config: Partial<CliConfig>) {
  try {
    const currentConfig = await getConfig();
    const newConfig = { ...currentConfig, ...config };
    
    await fs.ensureDir(CONFIG_DIR);
    await fs.writeJson(CONFIG_FILE, newConfig, { spaces: 2 });
    
    return newConfig;
  } catch (error) {
    console.error('Failed to save config:', error);
    throw error;
  }
}

export async function getApiKey(): Promise<string | undefined> {
  // 1. Check environment variable first
  if (process.env.MGZON_API_KEY) {
    return process.env.MGZON_API_KEY;
  }
  
  // 2. Check config file
  const config = await getConfig();
  return config.apiKey;
}

export async function getApiUrl(): Promise<string> {
  const config = await getConfig();
  return config.apiUrl || API_URLS.production;
}

export async function loginCommand(apiKey: string) {
  try {
    const apiUrl = await getApiUrl();
    
    // Use the CLI-specific login endpoint
    const response = await axios.post(`${apiUrl}/cli/auth/login`, {
      apiKey
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Login failed');
    }

    const { user, apiKey: keyInfo, session } = response.data.data;
    
    // Save to config
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
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to MGZON API. Check your network connection.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your key and try again.');
    } else if (error.response?.status === 403) {
      throw new Error('API key has insufficient permissions.');
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else {
      throw new Error(`Login failed: ${error.message}`);
    }
  }
}

// Verify API Key using /auth/verify endpoint
export async function verifyApiKey(apiKey: string) {
  try {
    const apiUrl = await getApiUrl();
    
    const response = await axios.post(`${apiUrl}/auth/verify`, {}, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid API key');
    }
    throw error;
  }
}

// Logout from API
export async function logout() {
  const config = await getConfig();
  
  if (config.apiKey) {
    try {
      const apiUrl = await getApiUrl();
      await axios.post(`${apiUrl}/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });
    } catch (error) {
      // Don't throw error if logout fails
      console.warn(chalk.yellow('Warning: Could not logout from API server'));
    }
  }
  
  // Clear local config
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

// Check authentication status
export async function isAuthenticated(): Promise<boolean> {
  const apiKey = await getApiKey();
  return !!apiKey;
}

// Get user info
export async function getUserInfo() {
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

// Get current project
export async function getCurrentProject(): Promise<string | null> {
  const config = await getConfig();
  return config.currentProject || null;
}

// Set current project
export async function setCurrentProject(projectPath: string) {
  await saveConfig({ currentProject: projectPath });
}

// Clear current project
export async function clearCurrentProject() {
  await saveConfig({ currentProject: undefined });
}

// Get project-specific config
export async function getProjectConfig(projectPath: string) {
  const projectConfigFile = join(projectPath, '.mgzon.json');
  
  if (await fs.pathExists(projectConfigFile)) {
    return await fs.readJson(projectConfigFile);
  }
  
  return {};
}

// Save project config
export async function saveProjectConfig(projectPath: string, config: any) {
  const projectConfigFile = join(projectPath, '.mgzon.json');
  await fs.writeJson(projectConfigFile, config, { spaces: 2 });
}

// Check for updates
export async function checkForUpdates() {
  try {
    const response = await axios.get('https://registry.npmjs.org/@mgzon/cli/latest', {
      timeout: 3000
    });
    
    const currentVersion = require('../../package.json').version;
    const latestVersion = response.data.version;
    
    if (currentVersion !== latestVersion) {
      console.log(chalk.yellow('\n⚠️  Update available!'));
      console.log(chalk.cyan(`   Current: ${currentVersion}`));
      console.log(chalk.cyan(`   Latest: ${latestVersion}`));
      console.log(chalk.cyan('   Run: npm install -g @mgzon/cli\n'));
    }
  } catch (error) {
    // Silent fail
  }
}
