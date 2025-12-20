// /workspaces/mgzon-cli/src/commands/debug.ts
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { getConfig, getApiKey, getApiUrl, testApiConnection } from '../utils/config';
import axios from 'axios';
import { networkInterfaces } from 'os';

export async function debugCommand(options: any) {
  const spinner = ora('Starting debug...').start();

  try {
    if (options.network) {
      await debugNetwork(spinner);
    } else if (options.performance) {
      await debugPerformance(spinner);
    } else if (options.memory) {
      await debugMemory(spinner);
    } else {
      // Show all debug info
      await debugAll(spinner);
    }

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Debug command failed'));
    console.error(chalk.red(`  Error: ${error.message}`));
  }
}

async function debugAll(spinner: Ora) {
  spinner.text = 'Gathering debug information...';
  
  const config = await getConfig();
  const apiKey = await getApiKey();
  const apiUrl = await getApiUrl();
  
  spinner.succeed(chalk.green('✅ Debug information collected'));
  
  console.log(chalk.cyan('\n🐛 Debug Information\n'));
  console.log(chalk.gray('═'.repeat(60)));
  
  // System Information
  console.log(chalk.bold('\n🖥️  System Information'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.cyan(`Platform:    ${process.platform}`));
  console.log(chalk.cyan(`Architecture: ${process.arch}`));
  console.log(chalk.cyan(`Node.js:     ${process.version}`));
  console.log(chalk.cyan(`NPM:         ${process.env.npm_config_user_agent || 'N/A'}`));
  
  // CLI Information
  console.log(chalk.bold('\n🛠️  CLI Information'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.cyan(`Version:     ${require('../../../package.json').version}`));
  console.log(chalk.cyan(`Config path: ${process.env.HOME}/.mgzon/config.json`));
  
  // Authentication
  console.log(chalk.bold('\n🔐 Authentication'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.cyan(`Authenticated: ${apiKey ? 'Yes' : 'No'}`));
  console.log(chalk.cyan(`API Key length: ${apiKey ? apiKey.length : 'N/A'}`));
  console.log(chalk.cyan(`API URL:       ${apiUrl}`));
  console.log(chalk.cyan(`Config URL:    ${config.apiUrl || 'Default'}`));
  console.log(chalk.cyan(`Environment:   ${config.defaultEnvironment || 'Default'}`));
  
  // Network Information - ⭐⭐ **هنا أهم حاجة: نستخدم apiUrl مش URL hardcoded**
  console.log(chalk.bold('\n🌐 Network Information'));
  console.log(chalk.gray('─'.repeat(40)));
  
  try {
    // ✅ نستخدم الـ apiUrl اللي في الـ config
    const apiTest = await testApiConnection();
    
    if (apiTest.success) {
      console.log(chalk.green(`MGZON API:     Reachable (${apiTest.url})`));
      
      // نجرب نشوف الـ response time
      const start = Date.now();
      await axios.get(`${apiUrl}/health`, { timeout: 5000 });
      const end = Date.now();
      console.log(chalk.cyan(`Response time: ${end - start}ms`));
    } else {
      console.log(chalk.red(`MGZON API:     Unreachable (${apiTest.url})`));
      console.log(chalk.red(`Error:         ${apiTest.error || 'Unknown'}`));
    }
  } catch (error: any) {
    console.log(chalk.red(`MGZON API:     Unreachable (${apiUrl})`));
    console.log(chalk.red(`Error:         ${error.message}`));
  }
  
  // Memory Usage
  console.log(chalk.bold('\n💾 Memory Usage'));
  console.log(chalk.gray('─'.repeat(40)));
  const memoryUsage = process.memoryUsage();
  console.log(chalk.cyan(`RSS:    ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`));
  console.log(chalk.cyan(`Heap:   ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`));
  console.log(chalk.cyan(`Total:  ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`));
  
  // Current Directory
  console.log(chalk.bold('\n📁 Current Directory'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.cyan(`Path: ${process.cwd()}`));
  
  // ⭐⭐ إضافة: Config Test
  console.log(chalk.bold('\n⚙️  Configuration Test'));
  console.log(chalk.gray('─'.repeat(40)));
  
  const testEndpoints = [
    { name: 'Auth Verify', endpoint: '/auth/verify' },
    { name: 'Health Check', endpoint: '/health' },
    { name: 'Apps List', endpoint: '/apps' },
    { name: 'Keys List', endpoint: '/keys' }
  ];
  
  for (const test of testEndpoints) {
    try {
      const response = await axios.get(`${apiUrl}${test.endpoint}`, { 
        timeout: 3000,
        validateStatus: () => true // أي status يعتبر valid عشان نشوف لو يعمل
      });
      
      if (response.status === 200 || response.status === 401) {
        console.log(chalk.green(`  ${test.name.padEnd(15)}: ✅ Reachable (${response.status})`));
      } else {
        console.log(chalk.yellow(`  ${test.name.padEnd(15)}: ⚠️  Responded (${response.status})`));
      }
    } catch (error) {
      console.log(chalk.red(`  ${test.name.padEnd(15)}: ❌ Unreachable`));
    }
  }
  
  console.log(chalk.gray('\n═'.repeat(60)));
  console.log(chalk.yellow('\n💡 Tips:'));
  console.log(chalk.cyan('  mz debug --network       # Network diagnostics'));
  console.log(chalk.cyan('  mz debug --performance   # Performance metrics'));
  console.log(chalk.cyan('  mz debug --memory        # Memory usage details'));
  console.log(chalk.cyan('\n🔧 Quick Fixes:'));
  console.log(chalk.gray('  mz config --set apiUrl=http://localhost:3000/api/v1'));
  console.log(chalk.gray('  mz config --reset'));
  console.log(chalk.gray('  export MGZON_API_KEY="your_api_key"\n'));
}

async function debugNetwork(spinner: Ora) {
  spinner.text = 'Running network diagnostics...';
  
  // ⭐⭐ نستخدم getApiUrl() مش hardcoded URLs
  const apiUrl = await getApiUrl();
  
  const tests = [
    { name: 'DNS Resolution', url: 'https://google.com' },
    { name: 'MGZON API', url: `${apiUrl}/health` },  // ✅ نستخدم apiUrl
    { name: 'NPM Registry', url: 'https://registry.npmjs.org' },
    { name: 'CLI Login', url: `${apiUrl}/cli/auth/login` },  // ✅ نختبر CLI endpoint
    { name: 'Auth Verify', url: `${apiUrl}/auth/verify` }  // ✅ نختبر Auth endpoint
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const start = Date.now();
      const response = await axios.get(test.url, { 
        timeout: 5000,
        validateStatus: () => true // أي status يعتبر valid
      });
      const end = Date.now();
      
      if (response.status === 200 || response.status === 401 || response.status === 404) {
        results.push({
          name: test.name,
          status: '✅ Reachable',
          time: `${end - start}ms`,
          statusCode: response.status
        });
      } else {
        results.push({
          name: test.name,
          status: '⚠️  Responded',
          time: `${end - start}ms`,
          statusCode: response.status
        });
      }
    } catch (error: any) {
      results.push({
        name: test.name,
        status: '❌ Unreachable',
        time: error.message,
        statusCode: null
      });
    }
  }
  
  spinner.succeed(chalk.green('Network diagnostics completed'));
  
  console.log(chalk.cyan('\n🌐 Network Diagnostics\n'));
  console.log(chalk.gray('─'.repeat(80)));
  
  results.forEach(result => {
    const statusColor = result.status.includes('✅') ? 'green' : 
                       result.status.includes('⚠️') ? 'yellow' : 'red';
    
    console.log(`${chalk.cyan(result.name.padEnd(20))}: ${chalk[statusColor](result.status)} ${result.statusCode ? `(${result.statusCode})` : ''} - ${result.time}`);
  });
  
  // Network interfaces
  console.log(chalk.gray('\n─'.repeat(80)));
  console.log(chalk.bold('\n📡 Network Interfaces'));
  console.log(chalk.gray('─'.repeat(40)));
  
  const nets = networkInterfaces();
  let hasInterfaces = false;
  
  for (const name of Object.keys(nets)) {
    const netInfo = nets[name];
    if (netInfo) {
      hasInterfaces = true;
      console.log(chalk.cyan(`\n${name}:`));
      netInfo.forEach(net => {
        if (net.family === 'IPv4') {
          console.log(chalk.gray(`  ${net.address} ${net.internal ? '(internal)' : ''}`));
        }
      });
    }
  }
  
  if (!hasInterfaces) {
    console.log(chalk.yellow('  No network interfaces found'));
  }
  
  // ⭐⭐ إضافة: Suggested API URLs
  console.log(chalk.gray('\n─'.repeat(80)));
  console.log(chalk.bold('\n🔗 Suggested API URLs'));
  console.log(chalk.gray('─'.repeat(40)));
  
  const suggestedUrls = [
    'http://localhost:3000/api/v1',
    'http://127.0.0.1:3000/api/v1',
    'http://0.0.0.0:3000/api/v1'
  ];
  
  for (const url of suggestedUrls) {
    try {
      const start = Date.now();
      await axios.get(`${url}/health`, { timeout: 2000 });
      const end = Date.now();
      console.log(chalk.green(`  ✅ ${url} - ${end - start}ms`));
    } catch (error) {
      console.log(chalk.red(`  ❌ ${url} - Unreachable`));
    }
  }
  
  console.log(chalk.gray('\n─'.repeat(80)));
  console.log(chalk.cyan('\n💡 Command to fix:'));
  console.log(chalk.gray('  mz config --set apiUrl=http://localhost:3000/api/v1'));
  console.log(chalk.gray('  mz config --list\n'));
}

async function debugPerformance(spinner: Ora) {
  spinner.text = 'Measuring performance...';
  
  const apiUrl = await getApiUrl();
  
  const metrics = {
    cliStartup: 'Fast',
    commandExecution: 'Fast',
    apiResponse: 'Unknown',
    localhostPing: 'Unknown'
  };
  
  // Measure localhost ping
  try {
    const start = Date.now();
    await axios.get('http://localhost:3000/api/v1/health', { 
      timeout: 3000,
      validateStatus: () => true 
    });
    const localhostTime = Date.now() - start;
    
    metrics.localhostPing = localhostTime < 100 ? 'Excellent' : 
                           localhostTime < 300 ? 'Good' : 
                           localhostTime < 1000 ? 'Slow' : 'Poor';
  } catch {
    metrics.localhostPing = 'Unreachable';
  }
  
  // Measure API response time
  try {
    const start = Date.now();
    await axios.get(`${apiUrl}/health`, { 
      timeout: 5000,
      validateStatus: () => true 
    });
    const apiTime = Date.now() - start;
    
    metrics.apiResponse = apiTime < 500 ? 'Excellent' : 
                         apiTime < 1000 ? 'Good' : 
                         apiTime < 2000 ? 'Slow' : 'Poor';
  } catch {
    metrics.apiResponse = 'Unavailable';
  }
  
  spinner.succeed(chalk.green('Performance metrics collected'));
  
  console.log(chalk.cyan('\n⚡ Performance Metrics\n'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.cyan(`API URL: ${apiUrl}`));
  console.log(chalk.gray('─'.repeat(60)));
  
  Object.entries(metrics).forEach(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const color = value === 'Excellent' || value === 'Fast' ? 'green' :
                  value === 'Good' ? 'cyan' :
                  value === 'Slow' ? 'yellow' :
                  value === 'Unreachable' || value === 'Unavailable' ? 'red' : 'gray';
    
    console.log(`${chalk.cyan(label.padEnd(25))}: ${chalk[color](value)}`);
  });
  
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.cyan('\n🎯 Performance Guide:'));
  console.log(chalk.gray('  < 100ms:  Excellent'));
  console.log(chalk.gray('  100-300ms: Good'));
  console.log(chalk.gray('  300-1000ms: Slow'));
  console.log(chalk.gray('  > 1000ms:  Poor\n'));
}

async function debugMemory(spinner: Ora) {
  spinner.text = 'Analyzing memory usage...';
  
  const memoryUsage = process.memoryUsage();
  const formatMB = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;
  
  spinner.succeed(chalk.green('Memory analysis completed'));
  
  console.log(chalk.cyan('\n💾 Memory Analysis\n'));
  console.log(chalk.gray('─'.repeat(50)));
  
  console.log(chalk.cyan(`RSS (Resident Set Size):     ${formatMB(memoryUsage.rss)}`));
  console.log(chalk.cyan(`Heap Total:                  ${formatMB(memoryUsage.heapTotal)}`));
  console.log(chalk.cyan(`Heap Used:                   ${formatMB(memoryUsage.heapUsed)}`));
  console.log(chalk.cyan(`External:                    ${formatMB(memoryUsage.external)}`));
  console.log(chalk.cyan(`Array Buffers:               ${formatMB(memoryUsage.arrayBuffers)}`));
  
  const heapUsedPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
  const heapColor = heapUsedPercent < 70 ? 'green' :
                    heapUsedPercent < 85 ? 'yellow' : 'red';
  
  console.log(chalk[heapColor](`Heap Usage:                  ${heapUsedPercent}%`));
  
  console.log(chalk.gray('\n─'.repeat(50)));
  console.log(chalk.yellow('\n💡 Memory Usage Guide:'));
  console.log(chalk.gray('  < 70%:  ✅ Excellent'));
  console.log(chalk.gray('  70-85%: ⚠️  Monitor'));
  console.log(chalk.gray('  85-95%: ⚠️  Warning'));
  console.log(chalk.gray('  > 95%:  ❌ Critical'));
  
  // ⭐⭐ إضافة: CLI Config Memory Usage
  console.log(chalk.gray('\n─'.repeat(50)));
  console.log(chalk.bold('\n⚙️  CLI Configuration'));
  console.log(chalk.gray('─'.repeat(30)));
  
  try {
    const config = await getConfig();
    const configSize = Buffer.byteLength(JSON.stringify(config));
    console.log(chalk.cyan(`Config size: ${Math.round(configSize / 1024)} KB`));
    console.log(chalk.cyan(`API Key: ${config.apiKey ? '✅ Set' : '❌ Not set'}`));
    console.log(chalk.cyan(`API URL: ${config.apiUrl || 'Default'}`));
  } catch (error: any) {
    console.log(chalk.red(`Config error: ${error.message}`));
  }
  
  console.log(chalk.gray('\n─'.repeat(50)));
  console.log(chalk.cyan('\n🔧 Command to clear cache:'));
  console.log(chalk.gray('  mz config --reset'));
  console.log(chalk.gray('  mz logout\n'));
}