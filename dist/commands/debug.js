"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugCommand = debugCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../utils/config");
const axios_1 = __importDefault(require("axios"));
const os_1 = require("os");
async function debugCommand(options) {
    const spinner = (0, ora_1.default)('Starting debug...').start();
    try {
        if (options.network) {
            await debugNetwork(spinner);
        }
        else if (options.performance) {
            await debugPerformance(spinner);
        }
        else if (options.memory) {
            await debugMemory(spinner);
        }
        else {
            await debugAll(spinner);
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Debug command failed'));
        console.error(chalk_1.default.red(`  Error: ${error.message}`));
    }
}
async function debugAll(spinner) {
    spinner.text = 'Gathering debug information...';
    const config = await (0, config_1.getConfig)();
    const apiKey = await (0, config_1.getApiKey)();
    const apiUrl = await (0, config_1.getApiUrl)();
    spinner.succeed(chalk_1.default.green('✅ Debug information collected'));
    console.log(chalk_1.default.cyan('\n🐛 Debug Information\n'));
    console.log(chalk_1.default.gray('═'.repeat(60)));
    console.log(chalk_1.default.bold('\n🖥️  System Information'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    console.log(chalk_1.default.cyan(`Platform:    ${process.platform}`));
    console.log(chalk_1.default.cyan(`Architecture: ${process.arch}`));
    console.log(chalk_1.default.cyan(`Node.js:     ${process.version}`));
    console.log(chalk_1.default.cyan(`NPM:         ${process.env.npm_config_user_agent || 'N/A'}`));
    console.log(chalk_1.default.bold('\n🛠️  CLI Information'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    console.log(chalk_1.default.cyan(`Version:     ${require('../../../package.json').version}`));
    console.log(chalk_1.default.cyan(`Config path: ${process.env.HOME}/.mgzon/config.json`));
    console.log(chalk_1.default.bold('\n🔐 Authentication'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    console.log(chalk_1.default.cyan(`Authenticated: ${apiKey ? 'Yes' : 'No'}`));
    console.log(chalk_1.default.cyan(`API Key length: ${apiKey ? apiKey.length : 'N/A'}`));
    console.log(chalk_1.default.cyan(`API URL:       ${apiUrl}`));
    console.log(chalk_1.default.cyan(`Config URL:    ${config.apiUrl || 'Default'}`));
    console.log(chalk_1.default.cyan(`Environment:   ${config.defaultEnvironment || 'Default'}`));
    console.log(chalk_1.default.bold('\n🌐 Network Information'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    try {
        const apiTest = await (0, config_1.testApiConnection)();
        if (apiTest.success) {
            console.log(chalk_1.default.green(`MGZON API:     Reachable (${apiTest.url})`));
            const start = Date.now();
            await axios_1.default.get(`${apiUrl}/health`, { timeout: 5000 });
            const end = Date.now();
            console.log(chalk_1.default.cyan(`Response time: ${end - start}ms`));
        }
        else {
            console.log(chalk_1.default.red(`MGZON API:     Unreachable (${apiTest.url})`));
            console.log(chalk_1.default.red(`Error:         ${apiTest.error || 'Unknown'}`));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red(`MGZON API:     Unreachable (${apiUrl})`));
        console.log(chalk_1.default.red(`Error:         ${error.message}`));
    }
    console.log(chalk_1.default.bold('\n💾 Memory Usage'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    const memoryUsage = process.memoryUsage();
    console.log(chalk_1.default.cyan(`RSS:    ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`));
    console.log(chalk_1.default.cyan(`Heap:   ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`));
    console.log(chalk_1.default.cyan(`Total:  ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`));
    console.log(chalk_1.default.bold('\n📁 Current Directory'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    console.log(chalk_1.default.cyan(`Path: ${process.cwd()}`));
    console.log(chalk_1.default.bold('\n⚙️  Configuration Test'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    const testEndpoints = [
        { name: 'Auth Verify', endpoint: '/auth/verify' },
        { name: 'Health Check', endpoint: '/health' },
        { name: 'Apps List', endpoint: '/apps' },
        { name: 'Keys List', endpoint: '/keys' }
    ];
    for (const test of testEndpoints) {
        try {
            const response = await axios_1.default.get(`${apiUrl}${test.endpoint}`, {
                timeout: 3000,
                validateStatus: () => true
            });
            if (response.status === 200 || response.status === 401) {
                console.log(chalk_1.default.green(`  ${test.name.padEnd(15)}: ✅ Reachable (${response.status})`));
            }
            else {
                console.log(chalk_1.default.yellow(`  ${test.name.padEnd(15)}: ⚠️  Responded (${response.status})`));
            }
        }
        catch (error) {
            console.log(chalk_1.default.red(`  ${test.name.padEnd(15)}: ❌ Unreachable`));
        }
    }
    console.log(chalk_1.default.gray('\n═'.repeat(60)));
    console.log(chalk_1.default.yellow('\n💡 Tips:'));
    console.log(chalk_1.default.cyan('  mz debug --network       # Network diagnostics'));
    console.log(chalk_1.default.cyan('  mz debug --performance   # Performance metrics'));
    console.log(chalk_1.default.cyan('  mz debug --memory        # Memory usage details'));
    console.log(chalk_1.default.cyan('\n🔧 Quick Fixes:'));
    console.log(chalk_1.default.gray('  mz config --set apiUrl=http://localhost:3000/api/v1'));
    console.log(chalk_1.default.gray('  mz config --reset'));
    console.log(chalk_1.default.gray('  export MGZON_API_KEY="your_api_key"\n'));
}
async function debugNetwork(spinner) {
    spinner.text = 'Running network diagnostics...';
    const apiUrl = await (0, config_1.getApiUrl)();
    const tests = [
        { name: 'DNS Resolution', url: 'https://google.com' },
        { name: 'MGZON API', url: `${apiUrl}/health` },
        { name: 'NPM Registry', url: 'https://registry.npmjs.org' },
        { name: 'CLI Login', url: `${apiUrl}/cli/auth/login` },
        { name: 'Auth Verify', url: `${apiUrl}/auth/verify` }
    ];
    const results = [];
    for (const test of tests) {
        try {
            const start = Date.now();
            const response = await axios_1.default.get(test.url, {
                timeout: 5000,
                validateStatus: () => true
            });
            const end = Date.now();
            if (response.status === 200 || response.status === 401 || response.status === 404) {
                results.push({
                    name: test.name,
                    status: '✅ Reachable',
                    time: `${end - start}ms`,
                    statusCode: response.status
                });
            }
            else {
                results.push({
                    name: test.name,
                    status: '⚠️  Responded',
                    time: `${end - start}ms`,
                    statusCode: response.status
                });
            }
        }
        catch (error) {
            results.push({
                name: test.name,
                status: '❌ Unreachable',
                time: error.message,
                statusCode: null
            });
        }
    }
    spinner.succeed(chalk_1.default.green('Network diagnostics completed'));
    console.log(chalk_1.default.cyan('\n🌐 Network Diagnostics\n'));
    console.log(chalk_1.default.gray('─'.repeat(80)));
    results.forEach(result => {
        const statusColor = result.status.includes('✅') ? 'green' :
            result.status.includes('⚠️') ? 'yellow' : 'red';
        console.log(`${chalk_1.default.cyan(result.name.padEnd(20))}: ${chalk_1.default[statusColor](result.status)} ${result.statusCode ? `(${result.statusCode})` : ''} - ${result.time}`);
    });
    console.log(chalk_1.default.gray('\n─'.repeat(80)));
    console.log(chalk_1.default.bold('\n📡 Network Interfaces'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    const nets = (0, os_1.networkInterfaces)();
    let hasInterfaces = false;
    for (const name of Object.keys(nets)) {
        const netInfo = nets[name];
        if (netInfo) {
            hasInterfaces = true;
            console.log(chalk_1.default.cyan(`\n${name}:`));
            netInfo.forEach(net => {
                if (net.family === 'IPv4') {
                    console.log(chalk_1.default.gray(`  ${net.address} ${net.internal ? '(internal)' : ''}`));
                }
            });
        }
    }
    if (!hasInterfaces) {
        console.log(chalk_1.default.yellow('  No network interfaces found'));
    }
    console.log(chalk_1.default.gray('\n─'.repeat(80)));
    console.log(chalk_1.default.bold('\n🔗 Suggested API URLs'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    const suggestedUrls = [
        'http://localhost:3000/api/v1',
        'http://127.0.0.1:3000/api/v1',
        'http://0.0.0.0:3000/api/v1'
    ];
    for (const url of suggestedUrls) {
        try {
            const start = Date.now();
            await axios_1.default.get(`${url}/health`, { timeout: 2000 });
            const end = Date.now();
            console.log(chalk_1.default.green(`  ✅ ${url} - ${end - start}ms`));
        }
        catch (error) {
            console.log(chalk_1.default.red(`  ❌ ${url} - Unreachable`));
        }
    }
    console.log(chalk_1.default.gray('\n─'.repeat(80)));
    console.log(chalk_1.default.cyan('\n💡 Command to fix:'));
    console.log(chalk_1.default.gray('  mz config --set apiUrl=http://localhost:3000/api/v1'));
    console.log(chalk_1.default.gray('  mz config --list\n'));
}
async function debugPerformance(spinner) {
    spinner.text = 'Measuring performance...';
    const apiUrl = await (0, config_1.getApiUrl)();
    const metrics = {
        cliStartup: 'Fast',
        commandExecution: 'Fast',
        apiResponse: 'Unknown',
        localhostPing: 'Unknown'
    };
    try {
        const start = Date.now();
        await axios_1.default.get('http://localhost:3000/api/v1/health', {
            timeout: 3000,
            validateStatus: () => true
        });
        const localhostTime = Date.now() - start;
        metrics.localhostPing = localhostTime < 100 ? 'Excellent' :
            localhostTime < 300 ? 'Good' :
                localhostTime < 1000 ? 'Slow' : 'Poor';
    }
    catch {
        metrics.localhostPing = 'Unreachable';
    }
    try {
        const start = Date.now();
        await axios_1.default.get(`${apiUrl}/health`, {
            timeout: 5000,
            validateStatus: () => true
        });
        const apiTime = Date.now() - start;
        metrics.apiResponse = apiTime < 500 ? 'Excellent' :
            apiTime < 1000 ? 'Good' :
                apiTime < 2000 ? 'Slow' : 'Poor';
    }
    catch {
        metrics.apiResponse = 'Unavailable';
    }
    spinner.succeed(chalk_1.default.green('Performance metrics collected'));
    console.log(chalk_1.default.cyan('\n⚡ Performance Metrics\n'));
    console.log(chalk_1.default.gray('─'.repeat(60)));
    console.log(chalk_1.default.cyan(`API URL: ${apiUrl}`));
    console.log(chalk_1.default.gray('─'.repeat(60)));
    Object.entries(metrics).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const color = value === 'Excellent' || value === 'Fast' ? 'green' :
            value === 'Good' ? 'cyan' :
                value === 'Slow' ? 'yellow' :
                    value === 'Unreachable' || value === 'Unavailable' ? 'red' : 'gray';
        console.log(`${chalk_1.default.cyan(label.padEnd(25))}: ${chalk_1.default[color](value)}`);
    });
    console.log(chalk_1.default.gray('─'.repeat(60)));
    console.log(chalk_1.default.cyan('\n🎯 Performance Guide:'));
    console.log(chalk_1.default.gray('  < 100ms:  Excellent'));
    console.log(chalk_1.default.gray('  100-300ms: Good'));
    console.log(chalk_1.default.gray('  300-1000ms: Slow'));
    console.log(chalk_1.default.gray('  > 1000ms:  Poor\n'));
}
async function debugMemory(spinner) {
    spinner.text = 'Analyzing memory usage...';
    const memoryUsage = process.memoryUsage();
    const formatMB = (bytes) => `${Math.round(bytes / 1024 / 1024)} MB`;
    spinner.succeed(chalk_1.default.green('Memory analysis completed'));
    console.log(chalk_1.default.cyan('\n💾 Memory Analysis\n'));
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log(chalk_1.default.cyan(`RSS (Resident Set Size):     ${formatMB(memoryUsage.rss)}`));
    console.log(chalk_1.default.cyan(`Heap Total:                  ${formatMB(memoryUsage.heapTotal)}`));
    console.log(chalk_1.default.cyan(`Heap Used:                   ${formatMB(memoryUsage.heapUsed)}`));
    console.log(chalk_1.default.cyan(`External:                    ${formatMB(memoryUsage.external)}`));
    console.log(chalk_1.default.cyan(`Array Buffers:               ${formatMB(memoryUsage.arrayBuffers)}`));
    const heapUsedPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    const heapColor = heapUsedPercent < 70 ? 'green' :
        heapUsedPercent < 85 ? 'yellow' : 'red';
    console.log(chalk_1.default[heapColor](`Heap Usage:                  ${heapUsedPercent}%`));
    console.log(chalk_1.default.gray('\n─'.repeat(50)));
    console.log(chalk_1.default.yellow('\n💡 Memory Usage Guide:'));
    console.log(chalk_1.default.gray('  < 70%:  ✅ Excellent'));
    console.log(chalk_1.default.gray('  70-85%: ⚠️  Monitor'));
    console.log(chalk_1.default.gray('  85-95%: ⚠️  Warning'));
    console.log(chalk_1.default.gray('  > 95%:  ❌ Critical'));
    console.log(chalk_1.default.gray('\n─'.repeat(50)));
    console.log(chalk_1.default.bold('\n⚙️  CLI Configuration'));
    console.log(chalk_1.default.gray('─'.repeat(30)));
    try {
        const config = await (0, config_1.getConfig)();
        const configSize = Buffer.byteLength(JSON.stringify(config));
        console.log(chalk_1.default.cyan(`Config size: ${Math.round(configSize / 1024)} KB`));
        console.log(chalk_1.default.cyan(`API Key: ${config.apiKey ? '✅ Set' : '❌ Not set'}`));
        console.log(chalk_1.default.cyan(`API URL: ${config.apiUrl || 'Default'}`));
    }
    catch (error) {
        console.log(chalk_1.default.red(`Config error: ${error.message}`));
    }
    console.log(chalk_1.default.gray('\n─'.repeat(50)));
    console.log(chalk_1.default.cyan('\n🔧 Command to clear cache:'));
    console.log(chalk_1.default.gray('  mz config --reset'));
    console.log(chalk_1.default.gray('  mz logout\n'));
}
//# sourceMappingURL=debug.js.map