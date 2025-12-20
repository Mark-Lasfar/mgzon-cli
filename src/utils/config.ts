// /workspaces/mgzon-cli/src/utils/config.ts
import { homedir } from 'os';
import { join } from 'path';
import { URL } from 'url';
import fs from 'fs-extra';
import axios from 'axios';
import chalk from 'chalk';

const CONFIG_DIR = join(homedir(), '.mgzon');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface CliConfig {
  apiKey?: string;
  apiUrl?: string;
  defaultEnvironment?: 'development' | 'staging' | 'production' | 'sandbox';
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
  expiresAt?: string;
  useLocalhost?: boolean;
  useNgrok?: boolean;
  ngrokUrl?: string;
}

// ⭐⭐ دالة لتحديد أفضل API URL تلقائياً
async function determineBestApiUrl(): Promise<string> {
  try {
    console.log(chalk.gray('   🔍 Auto-detecting best API URL...'));
    
    const testUrls = [
      { name: 'localhost', url: 'http://localhost:3000/api/v1' },
      { name: 'ngrok', url: 'https://af354cda3bc2.ngrok-free.app/api/v1' }, // ⭐⭐ مثال
      { name: 'local IP', url: 'http://192.168.1.4:3000/api/v1' }, // ⭐⭐ من الـ logs
    ];
    
    for (const test of testUrls) {
      try {
        console.log(chalk.gray(`   Testing ${test.name}: ${test.url}`));
        const response = await axios.get(`${test.url}/health`, { timeout: 3000 });
        
        if (response.status === 200) {
          console.log(chalk.green(`   ✅ ${test.name} is reachable`));
          return test.url;
        }
      } catch (error: unknown) {
        console.log(chalk.yellow(`   ❌ ${test.name} not reachable: ${error}`));
      }
    }
    
    console.log(chalk.gray('   ⚠️  No reachable URLs found, using default'));
    return 'http://localhost:3000/api/v1';
    
  } catch (error) {
    console.log(chalk.gray(`   ⚠️  Error determining best URL: ${error}, using localhost`));
    return 'http://localhost:3000/api/v1';
  }
}

export async function getConfig(): Promise<CliConfig> {
  try {
    await fs.ensureDir(CONFIG_DIR);
    
    if (await fs.pathExists(CONFIG_FILE)) {
      const config = await fs.readJson(CONFIG_FILE);
      return config;
    }
    
    // ✅ نستخدم auto-detection للإعداد الأولي
    const bestUrl = await determineBestApiUrl();
    
    const defaultConfig: CliConfig = {
      apiUrl: bestUrl,
      defaultEnvironment: 'development',
      theme: 'default',
      useLocalhost: bestUrl.includes('localhost'),
      useNgrok: bestUrl.includes('ngrok')
    };
    
    await fs.writeJson(CONFIG_FILE, defaultConfig, { spaces: 2 });
    return defaultConfig;
  } catch (error: any) {
    console.error('Error reading config:', error.message || error);
    return { 
      apiUrl: 'http://localhost:3000/api/v1',
      useLocalhost: false,
      useNgrok: false 
    };
  }
}

export async function saveConfig(config: Partial<CliConfig>) {
  try {
    const currentConfig = await getConfig();
    const newConfig = { ...currentConfig, ...config };
    
    // ⭐⭐ منطق تلقائي: تحديد نوع الاتصال بناءً على الـ URL
    if (newConfig.apiUrl) {
      if (newConfig.apiUrl.includes('ngrok')) {
        newConfig.useNgrok = true;
        newConfig.useLocalhost = false;
        newConfig.ngrokUrl = newConfig.apiUrl.replace('/api/v1', '');
      } else if (newConfig.apiUrl.includes('localhost')) {
        newConfig.useLocalhost = true;
        newConfig.useNgrok = false;
        newConfig.ngrokUrl = undefined;
      }
    }
    
    await fs.ensureDir(CONFIG_DIR);
    await fs.writeJson(CONFIG_FILE, newConfig, { spaces: 2 });
    
    // ⭐⭐ عرض رسالة توضيحية
    if (newConfig.apiUrl && newConfig.apiUrl !== currentConfig.apiUrl) {
      console.log(chalk.gray('\n   ⚙️  Configuration updated:'));
      console.log(chalk.cyan(`     API URL: ${newConfig.apiUrl}`));
      console.log(chalk.cyan(`     Mode: ${newConfig.useNgrok ? 'Ngrok (Remote)' : 'Localhost (Local)'}`));
    }
    
    return newConfig;
  } catch (error) {
    console.error('Failed to save config:', error);
    throw error;
  }
}

// ⭐⭐ دالة محسنة لبناء API URLs مع auto-detection
export async function getApiUrl(): Promise<string> {
  const config = await getConfig();
  
  // ⭐⭐ إذا كان هناك مفتاح في environment variable، نستخدمه أولاً
  if (process.env.MGZON_API_URL) {
    console.log(chalk.gray(`   Using MGZON_API_URL from env: ${process.env.MGZON_API_URL}`));
    return process.env.MGZON_API_URL;
  }
  
  if (!config.apiUrl) {
    // ⭐⭐ إذا مفيش config، نجرب نحدد أفضل URL
    const bestUrl = await determineBestApiUrl();
    await saveConfig({ apiUrl: bestUrl });
    return bestUrl;
  }
  
  return config.apiUrl;
}

// ⭐⭐ دالة جديدة: اكتشاف أفضل اتصال تلقائياً
export async function autoDetectConnection(): Promise<{
  type: 'localhost' | 'ngrok' | 'ip' | 'unknown';
  url: string;
  reachable: boolean;
}> {
  console.log(chalk.gray('   🔍 Auto-detecting connection...'));
  
  const testUrls = [
    { type: 'localhost', url: 'http://localhost:3000/api/v1' },
    { type: 'ngrok', url: 'https://af354cda3bc2.ngrok-free.app/api/v1' },
    { type: 'ip', url: 'http://192.168.1.4:3000/api/v1' },
  ];
  
  for (const test of testUrls) {
    try {
      console.log(chalk.gray(`   Testing ${test.type}: ${test.url}`));
      const response = await axios.get(`${test.url}/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log(chalk.green(`   ✅ ${test.type} is reachable`));
        return {
          type: test.type as 'localhost' | 'ngrok' | 'ip' | 'unknown',
          url: test.url,
          reachable: true
        };
      }
    } catch (error: any) {
      console.log(chalk.yellow(`   ❌ ${test.type} not reachable: ${error.message || error}`));
    }
  }
  
  return {
    type: 'unknown',
    url: 'http://localhost:3000/api/v1',
    reachable: false
  };
}

// ⭐⭐ دالة جديدة: setup wizard للمستخدمين الجدد
export async function setupWizard() {
  console.log(chalk.cyan('\n' + '═'.repeat(50)));
  console.log(chalk.bold('🚀 MGZON CLI Setup Wizard'));
  console.log(chalk.cyan('═'.repeat(50)));
  
  const { default: inquirer } = await import('inquirer');
  
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
      validate: (input: string) => {
        if (!input) return 'URL is required';
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    }
  ]);
  
  let apiUrl: string;
  
  switch (answers.connectionType) {
    case 'localhost':
      apiUrl = 'http://localhost:3000/api/v1';
      break;
    case 'ngrok': {
      console.log(chalk.yellow('\n⚠️  Note: You need to run ngrok separately:'));
      console.log(chalk.cyan('  1. Install ngrok: https://ngrok.com/download'));
      console.log(chalk.cyan('  2. Run: ngrok http 3000'));
      console.log(chalk.cyan('  3. Copy the forwarding URL (e.g., https://abc123.ngrok.io)'));
      
      const { ngrokUrl } = await inquirer.prompt([
        {
          type: 'input',
          name: 'ngrokUrl',
          message: 'Enter your ngrok URL (without /api/v1):',
          validate: (input: string) => {
            if (!input) return 'URL is required';
            try {
              new URL(input);
              return true;
            } catch {
              return 'Please enter a valid URL';
            }
          }
        }
      ]);
      
      apiUrl = `${ngrokUrl}/api/v1`;
      break;
    }
    case 'custom':
      apiUrl = answers.customUrl;
      break;
    default:
      apiUrl = 'http://localhost:3000/api/v1';
  }
  
  await saveConfig({ apiUrl });
  
  console.log(chalk.green('\n✅ Setup complete!'));
  console.log(chalk.cyan(`   API URL set to: ${apiUrl}`));
  console.log(chalk.cyan('\n   Next: mz login\n'));
}

// ⭐⭐ تحديث دالة login لتدعم auto-detection
export async function loginCommand(apiKey: string) {
  try {
    const apiUrl = await getApiUrl();
    
    console.log(chalk.gray(`   Debug: Login URL: ${apiUrl}/cli/auth/login`));
    
    // ✅ محاولة auto-detection إذا فشل الاتصال
    let response;
    try {
      response = await axios.post(`${apiUrl}/cli/auth/login`, {
        apiKey
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
    } catch (firstError: unknown) {
      // ⭐⭐ إذا فشل الاتصال، نجرب auto-detection
      console.log(chalk.yellow('   ⚠️  Connection failed, trying auto-detection...'));
      
      const bestConnection = await autoDetectConnection();
      
      if (!bestConnection.reachable) {
        throw firstError; // نرمي الخطأ الأصلي
      }
      
      // ⭐⭐ نجرب مع URL الجديد
      console.log(chalk.gray(`   Debug: Retrying with ${bestConnection.type}: ${bestConnection.url}`));
      response = await axios.post(`${bestConnection.url}/cli/auth/login`, {
        apiKey
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      // ⭐⭐ نحفظ الـ URL الجديد في الـ config
      await saveConfig({ apiUrl: bestConnection.url });
    }

    if (!response.data.success) {
      throw new Error(response.data.error || 'Login failed');
    }

    const { user, session } = response.data.data;
    
    // Calculate expiresAt from expiresIn if not provided
    let expiresAt = session?.expiresAt;
    if (!expiresAt && session?.expiresIn) {
      expiresAt = new Date(Date.now() + (session.expiresIn * 1000)).toISOString();
    }
    
    // Save
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
      expiresAt: expiresAt,
      lastLogin: new Date().toISOString()
    });

    return user;
  } catch (error: unknown) {
    const err = error as any;
    if (err.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to MGZON API at ${await getApiUrl()}. Is the server running?`);
    } else if (err.response?.status === 401) {
      throw new Error('Invalid API key.');
    } else if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    } else {
      throw new Error(`Login failed: ${(error as any).message || error}`);
    }
  }
}

// ⭐⭐ دالة جديدة: الحصول على API key من environment أو config
export async function getApiKey(): Promise<string | undefined> {
  // 1. Environment variable أولاً (الأفضل)
  if (process.env.MGZON_API_KEY) {
    console.log(chalk.gray('   Using MGZON_API_KEY from environment variable'));
    return process.env.MGZON_API_KEY;
  }
  
  // 2. Config file
  const config = await getConfig();
  return config.apiKey;
}

// ⭐⭐ دالة جديدة: الحصول على base URL بدون /api/v1
export async function getBaseUrl(): Promise<string> {
  const apiUrl = await getApiUrl();
  return apiUrl.replace('/api/v1', '');
}

// ⭐⭐ دالة جديدة: التحقق من API key مع دعم auto-detection
export async function verifyApiKey(apiKey: string) {
  try {
    const baseUrl = await getBaseUrl();
    
    const response = await axios.post(`${baseUrl}/api/v1/auth/verify`, {}, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error: unknown) {
    const err = error as any;
    if (err.response?.status === 401) {
      throw new Error('Invalid API key');
    } else if (err.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to API server. Check if server is running.');
    }
    throw error;
  }
}

// ⭐⭐ دالة مساعدة: اختبار اتصال الـ API
export async function testApiConnection(): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const apiUrl = await getApiUrl();
    const healthUrl = apiUrl.replace('/api/v1', '/api/v1/health');
    
    const response = await axios.get(healthUrl, { timeout: 5000 });
    return {
      success: response.data.success || true,
      url: healthUrl
    };
  } catch (error: unknown) {
    const err = error as any;
    return {
      success: false,
      url: await getApiUrl(),
      error: err.message
    };
  }
}

// Logout from API
export async function logout() {
  const config = await getConfig();
  
  if (config.apiKey) {
    try {
      const baseUrl = await getBaseUrl();
      await axios.post(`${baseUrl}/api/v1/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });
    } catch {
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
    isAdmin: config.isAdmin,
    apiUrl: config.apiUrl
  };
}

// ⭐⭐ Get current project with validation
export async function getCurrentProject(): Promise<{ path: string; valid: boolean } | null> {
  const config = await getConfig();
  
  if (!config.currentProject) {
    return null;
  }
  
  const valid = await fs.pathExists(config.currentProject);
  return {
    path: config.currentProject,
    valid
  };
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
export async function saveProjectConfig(projectPath: string, config: Record<string, unknown>) {
  const projectConfigFile = join(projectPath, '.mgzon.json');
  await fs.writeJson(projectConfigFile, config, { spaces: 2 });
}

// ⭐⭐ Check for updates with better error handling
export async function checkForUpdates() {
  try {
    const response = await axios.get('https://registry.npmjs.org/@mgzon/cli/latest', {
      timeout: 3000
    });
    
    const packageJson = await fs.readJson(join(__dirname, '../../package.json'));
    const currentVersion = packageJson.version;
    const latestVersion = response.data.version;
    
    if (currentVersion !== latestVersion) {
      console.log(chalk.yellow('\n' + '─'.repeat(50)));
      console.log(chalk.yellow('⚠️  Update available!'));
      console.log(chalk.cyan(`   Current: ${currentVersion}`));
      console.log(chalk.cyan(`   Latest: ${latestVersion}`));
      console.log(chalk.cyan('   Run: npm install -g @mgzon/cli'));
      console.log(chalk.yellow('─'.repeat(50) + '\n'));
    }
  } catch {
    // Silent fail
  }
}

// ⭐⭐ دالة جديدة: validate API endpoints
export async function validateApiEndpoints(): Promise<{
  health: string;
  webhooks: string;
  apps: string;
  auth: string;
}> {
  const apiUrl = await getApiUrl();
  
  return {
    health: `${apiUrl}/health`,
    webhooks: `${apiUrl}/webhooks`,
    apps: `${apiUrl}/apps`,
    auth: `${apiUrl}/auth/verify`
  };
}

// ⭐⭐ دالة جديدة: test all endpoints
export async function testAllEndpoints(): Promise<Record<string, boolean>> {
  const endpoints = await validateApiEndpoints();
  const results: Record<string, boolean> = {};
  
  for (const [name, url] of Object.entries(endpoints)) {
    try {
      const response = await axios.get(url, { timeout: 3000 });
      results[name] = response.status === 200;
    } catch {
      results[name] = false;
    }
  }
  
  return results;
}