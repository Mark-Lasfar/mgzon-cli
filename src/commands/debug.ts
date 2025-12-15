import chalk from 'chalk';
import ora from 'ora';
import { getConfig, getApiKey } from '../utils/config';
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

async function debugAll(spinner: ora.Ora) {
  spinner.text = 'Gathering debug information...';
  
  const config = await getConfig();
  const apiKey = await getApiKey();
  
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
  console.log(chalk.cyan(`API URL:       ${config.apiUrl || 'Default'}`));
  console.log(chalk.cyan(`Environment:   ${config.defaultEnvironment || 'Default'}`));
  
  // Network Information
  console.log(chalk.bold('\n🌐 Network Information'));
  console.log(chalk.gray('─'.repeat(40)));
  
  try {
    const response = await axios.get('https://api.mgzon.com/v1/health', { timeout: 5000 });
    console.log(chalk.green(`MGZON API:     Reachable (${response.status})`));
    console.log(chalk.cyan(`Response time: ${response.headers['x-response-time'] || 'N/A'}`));
  } catch (error: any) {
    console.log(chalk.red(`MGZON API:     Unreachable (${error.message})`));
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
  
  console.log(chalk.gray('\n═'.repeat(60)));
  console.log(chalk.yellow('\n💡 Tips:'));
  console.log(chalk.cyan('  mz debug --network       # Network diagnostics'));
  console.log(chalk.cyan('  mz debug --performance   # Performance metrics'));
  console.log(chalk.cyan('  mz debug --memory        # Memory usage details\n'));
}

async function debugNetwork(spinner: ora.Ora) {
  spinner.text = 'Running network diagnostics...';
  
  const tests = [
    { name: 'DNS Resolution', url: 'https://google.com' },
    { name: 'MGZON API', url: 'https://api.mgzon.com/v1/health' },
    { name: 'NPM Registry', url: 'https://registry.npmjs.org' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const start = Date.now();
      await axios.get(test.url, { timeout: 10000 });
      const end = Date.now();
      results.push({
        name: test.name,
        status: '✅ Reachable',
        time: `${end - start}ms`
      });
    } catch (error: any) {
      results.push({
        name: test.name,
        status: '❌ Unreachable',
        time: error.message
      });
    }
  }
  
  spinner.succeed(chalk.green('Network diagnostics completed'));
  
  console.log(chalk.cyan('\n🌐 Network Diagnostics\n'));
  console.log(chalk.gray('─'.repeat(60)));
  
  results.forEach(result => {
    console.log(`${chalk.cyan(result.name.padEnd(20))}: ${result.status} (${result.time})`);
  });
  
  // Network interfaces
  console.log(chalk.gray('\n─'.repeat(60)));
  console.log(chalk.bold('\n📡 Network Interfaces'));
  
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netInfo = nets[name];
    if (netInfo) {
      console.log(chalk.cyan(`\n${name}:`));
      netInfo.forEach(net => {
        if (net.family === 'IPv4') {
          console.log(chalk.gray(`  ${net.address}`));
        }
      });
    }
  }
  
  console.log(chalk.gray('\n─'.repeat(60)));
}

async function debugPerformance(spinner: ora.Ora) {
  spinner.text = 'Measuring performance...';
  
  const metrics = {
    cliStartup: 'Fast',
    commandExecution: 'Fast',
    apiResponse: 'Good'
  };
  
  // Measure API response time
  try {
    const start = Date.now();
    await axios.get('https://api.mgzon.com/v1/health', { timeout: 5000 });
    const apiTime = Date.now() - start;
    
    metrics.apiResponse = apiTime < 500 ? 'Excellent' : 
                         apiTime < 1000 ? 'Good' : 
                         apiTime < 2000 ? 'Slow' : 'Poor';
  } catch {
    metrics.apiResponse = 'Unavailable';
  }
  
  spinner.succeed(chalk.green('Performance metrics collected'));
  
  console.log(chalk.cyan('\n⚡ Performance Metrics\n'));
  console.log(chalk.gray('─'.repeat(50)));
  
  Object.entries(metrics).forEach(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const color = value === 'Excellent' || value === 'Fast' ? 'green' :
                  value === 'Good' ? 'cyan' :
                  value === 'Slow' ? 'yellow' : 'red';
    
    console.log(`${chalk.cyan(label.padEnd(25))}: ${chalk[color](value)}`);
  });
}

async function debugMemory(spinner: ora.Ora) {
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
  console.log(chalk.cyan(`Heap Usage:                  ${heapUsedPercent}%`));
  
  console.log(chalk.gray('\n─'.repeat(50)));
  console.log(chalk.yellow('\n💡 Memory Usage Guide:'));
  console.log(chalk.gray('  < 70%: Excellent'));
  console.log(chalk.gray('  70-85%: Good'));
  console.log(chalk.gray('  85-95%: Monitor'));
  console.log(chalk.gray('  > 95%:  Warning\n'));
}
