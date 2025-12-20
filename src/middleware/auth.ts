// /workspaces/mgzon-cli/src/middleware/auth.ts
import chalk from 'chalk';
import { getApiKey, verifyApiKey, getConfig, getApiUrl } from '../utils/config';
import axios from 'axios';

interface AuthInfo {
  apiKey: string;
  apiUrl: string;
  user?: any;
  rateLimit?: any;
}

export async function requireAuth(silent = false): Promise<AuthInfo | null> {
  try {
    const apiKey = await getApiKey();
    const apiUrl = await getApiUrl();
    
    if (!silent) {
      console.log(chalk.gray(`   Debug: API URL: ${apiUrl}`));
    }
    
    if (!apiKey) {
      if (!silent) {
        console.log(chalk.yellow('\n⚠️  You are not logged in.'));
        console.log(chalk.cyan('   Run: mz login'));
        console.log(chalk.cyan(`   API URL: ${apiUrl}`));
        console.log(chalk.cyan('   Or set MGZON_API_KEY environment variable\n'));
        
        const { default: inquirer } = await import('inquirer');
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
      // ✅ إصلاح: نستخدم CLI login endpoint بدلاً من auth/verify
      if (!silent) {
        console.log(chalk.gray(`   Debug: Verifying API key via CLI login endpoint`));
      }
      
      // نستخدم CLI login للتحقق بدلاً من auth/verify
      const response = await axios.post(`${apiUrl}/cli/auth/login`, {
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
      } else {
        throw new Error(response.data.error || 'API key verification failed');
      }
      
    } catch (error: any) {
      if (!silent) {
        console.log(chalk.red('\n❌ Authentication failed!'));
        
        if (error.response?.status === 401) {
          console.log(chalk.cyan(`   Invalid API key. Please login again.`));
        } else {
          console.log(chalk.cyan(`   Error: ${error.message || 'Unknown error'}`));
        }
        
        console.log(chalk.cyan('\n   Run: mz login to re-authenticate'));
        
        const { default: inquirer } = await import('inquirer');
        const { relogin } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'relogin',
            message: 'Login now?',
            default: true
          }
        ]);
        
        if (relogin) {
          const { loginCommand } = await import('../commands/login');
          await loginCommand({});
          const newApiKey = await getApiKey();
          const config = await getConfig();
          return { 
            apiKey: newApiKey!, 
            apiUrl: config.apiUrl || apiUrl 
          };
        }
      }
      
      throw error;
    }

  } catch (error: any) {
    if (!silent) {
      console.error(chalk.red('Auth error:'), error.message);
      console.log(chalk.gray(`   Current API URL: ${await getApiUrl()}`));
      console.log(chalk.cyan('   Try: mz config --set apiUrl=http://localhost:3000/api/v1'));
    }
    throw error;
  }
}

export async function getAuthHeaders() {
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

// Helper to build API URLs
export async function buildApiUrl(endpoint: string): Promise<string> {
  const apiUrl = await getApiUrl();
  const fullUrl = `${apiUrl}${endpoint}`;
  
  // ✅ إضافة debug log هنا
  console.log(chalk.gray(`   Debug: Building API URL: ${fullUrl}`));
  
  return fullUrl;
}

// Get user info from API - تحديث هذه الدالة أيضاً
export async function getApiUserInfo() {
  const auth = await requireAuth(true);
  
  if (!auth) {
    throw new Error('Not authenticated');
  }

  // ✅ إصلاح: نستخدم CLI login endpoint
  const response = await axios.post(`${auth.apiUrl}/cli/auth/login`, {
    apiKey: auth.apiKey
  }, {
    headers: { 
      'Content-Type': 'application/json'
    }
  });

  return response.data.data.user;
}