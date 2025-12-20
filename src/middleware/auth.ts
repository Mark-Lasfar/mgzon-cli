// /workspaces/mgzon-cli/src/middleware/auth.ts
import chalk from 'chalk';
import { getApiKey, getConfig, saveConfig, getApiUrl } from '../utils/config';
import axios from 'axios';

interface AuthInfo {
  apiKey: string;
  apiUrl: string;
  user?: any;
  rateLimit?: any;
  sessionToken?: string;
  expiresAt?: string;
}

// Cache for authentication state
let authCache: {
  data: AuthInfo | null;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
} = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes
};

function isAuthCacheValid(): boolean {
  return authCache.data !== null && (Date.now() - authCache.timestamp) < authCache.ttl;
}

export async function requireAuth(silent = false): Promise<AuthInfo | null> {
  // Check cache first
  if (isAuthCacheValid()) {
    if (!silent) {
      console.log(chalk.gray(`   Debug: Using cached authentication (${Math.round((Date.now() - authCache.timestamp) / 1000)}s ago)`));
    }
    return authCache.data;
  }

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

    // Check if we have a valid session token
    const config = await getConfig();
    if (config.sessionToken && config.expiresAt) {
      const expiresAt = new Date(config.expiresAt);
      if (expiresAt > new Date()) {
        // Session is still valid
        const authInfo = {
          apiKey,
          apiUrl,
          user: {
            id: config.userId,
            name: config.name,
            email: config.email,
            isDeveloper: config.isDeveloper,
            isSeller: config.isSeller,
            isAdmin: config.isAdmin
          },
          sessionToken: config.sessionToken
        };

        // Cache the result
        authCache.data = authInfo;
        authCache.timestamp = Date.now();

        if (!silent) {
          console.log(chalk.gray(`   Debug: Using valid session token (expires: ${expiresAt.toISOString()})`));
        }
        return authInfo;
      }
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
        // Calculate expiresAt from expiresIn if not provided
        let expiresAt = response.data.data.session?.expiresAt;
        if (!expiresAt && response.data.data.session?.expiresIn) {
          expiresAt = new Date(Date.now() + (response.data.data.session.expiresIn * 1000)).toISOString();
        }

        const authInfo = {
          apiKey,
          apiUrl,
          user: response.data.data.user,
          rateLimit: response.data.data.apiKey?.rateLimit,
          sessionToken: response.data.data.session?.token,
          expiresAt
        };

        // Cache the result
        authCache.data = authInfo;
        authCache.timestamp = Date.now();

        // Save session info to config
        if (authInfo.sessionToken && authInfo.expiresAt) {
          await saveConfig({
            sessionToken: authInfo.sessionToken,
            expiresAt: authInfo.expiresAt,
            userId: authInfo.user?.id,
            name: authInfo.user?.name,
            email: authInfo.user?.email,
            isDeveloper: authInfo.user?.isDeveloper,
            isSeller: authInfo.user?.isSeller,
            isAdmin: authInfo.user?.isAdmin
          });
        }

        return authInfo;
      } else {
        throw new Error(response.data.error || 'API key verification failed');
      }

    } catch (error: any) {
      if (!silent) {
        console.log(chalk.red('\n❌ Authentication failed!'));

        if (error.response?.status === 401) {
          console.log(chalk.cyan(`   Invalid API key. Please login again.`));
          console.log(chalk.gray(`   API Key: ${apiKey.substring(0, 12)}...`));
          console.log(chalk.gray(`   API URL: ${apiUrl}`));
          
          // Log more details if available
          if (error.response?.data) {
            console.log(chalk.gray(`   Error details: ${JSON.stringify(error.response.data, null, 2)}`));
          }
        } else if (error.response?.status === 429) {
          console.log(chalk.cyan(`   Rate limit exceeded. Please try again later.`));
        } else {
          console.log(chalk.cyan(`   Error: ${error.message || 'Unknown error'}`));
          console.log(chalk.gray(`   Status: ${error.response?.status || 'No response'}`));
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
          const newConfig = await getConfig();
          return {
            apiKey: newApiKey!,
            apiUrl: newConfig.apiUrl || apiUrl
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

  // Use session token if available and valid, otherwise use API key
  const token = auth.sessionToken || auth.apiKey;

  return {
    'Authorization': `Bearer ${token}`,
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