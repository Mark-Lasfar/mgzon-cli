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
    
    if (!apiKey) {
      if (!silent) {
        console.log(chalk.yellow('\n⚠️  You are not logged in.'));
        console.log(chalk.cyan('   Run: mz login'));
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
      // Verify the API key is still valid
      const response = await axios.post(`${apiUrl}/auth/verify`, {}, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data.success) {
        return {
          apiKey,
          apiUrl,
          user: response.data.data.user,
          rateLimit: response.data.data.rateLimit
        };
      } else {
        throw new Error('API key verification failed');
      }
      
    } catch (error: any) {
      if (!silent) {
        console.log(chalk.red('\n❌ Your API key is invalid or expired.'));
        console.log(chalk.cyan('   Run: mz login'));
        
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
  return `${apiUrl}${endpoint}`;
}

// Get user info from API
export async function getApiUserInfo() {
  const auth = await requireAuth(true);
  
  if (!auth) {
    throw new Error('Not authenticated');
  }

  const response = await axios.post(`${auth.apiUrl}/auth/verify`, {}, {
    headers: { 
      'Authorization': `Bearer ${auth.apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.data.user;
}
