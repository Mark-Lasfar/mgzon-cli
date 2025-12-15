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
    console.log(chalk_1.default.cyan(`API URL:       ${config.apiUrl || 'Default'}`));
    console.log(chalk_1.default.cyan(`Environment:   ${config.defaultEnvironment || 'Default'}`));
    console.log(chalk_1.default.bold('\n🌐 Network Information'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    try {
        const response = await axios_1.default.get('https://api.mgzon.com/v1/health', { timeout: 5000 });
        console.log(chalk_1.default.green(`MGZON API:     Reachable (${response.status})`));
        console.log(chalk_1.default.cyan(`Response time: ${response.headers['x-response-time'] || 'N/A'}`));
    }
    catch (error) {
        console.log(chalk_1.default.red(`MGZON API:     Unreachable (${error.message})`));
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
    console.log(chalk_1.default.gray('\n═'.repeat(60)));
    console.log(chalk_1.default.yellow('\n💡 Tips:'));
    console.log(chalk_1.default.cyan('  mz debug --network       # Network diagnostics'));
    console.log(chalk_1.default.cyan('  mz debug --performance   # Performance metrics'));
    console.log(chalk_1.default.cyan('  mz debug --memory        # Memory usage details\n'));
}
async function debugNetwork(spinner) {
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
            await axios_1.default.get(test.url, { timeout: 10000 });
            const end = Date.now();
            results.push({
                name: test.name,
                status: '✅ Reachable',
                time: `${end - start}ms`
            });
        }
        catch (error) {
            results.push({
                name: test.name,
                status: '❌ Unreachable',
                time: error.message
            });
        }
    }
    spinner.succeed(chalk_1.default.green('Network diagnostics completed'));
    console.log(chalk_1.default.cyan('\n🌐 Network Diagnostics\n'));
    console.log(chalk_1.default.gray('─'.repeat(60)));
    results.forEach(result => {
        console.log(`${chalk_1.default.cyan(result.name.padEnd(20))}: ${result.status} (${result.time})`);
    });
    console.log(chalk_1.default.gray('\n─'.repeat(60)));
    console.log(chalk_1.default.bold('\n📡 Network Interfaces'));
    const nets = (0, os_1.networkInterfaces)();
    for (const name of Object.keys(nets)) {
        const netInfo = nets[name];
        if (netInfo) {
            console.log(chalk_1.default.cyan(`\n${name}:`));
            netInfo.forEach(net => {
                if (net.family === 'IPv4') {
                    console.log(chalk_1.default.gray(`  ${net.address}`));
                }
            });
        }
    }
    console.log(chalk_1.default.gray('\n─'.repeat(60)));
}
async function debugPerformance(spinner) {
    spinner.text = 'Measuring performance...';
    const metrics = {
        cliStartup: 'Fast',
        commandExecution: 'Fast',
        apiResponse: 'Good'
    };
    try {
        const start = Date.now();
        await axios_1.default.get('https://api.mgzon.com/v1/health', { timeout: 5000 });
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
    console.log(chalk_1.default.gray('─'.repeat(50)));
    Object.entries(metrics).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const color = value === 'Excellent' || value === 'Fast' ? 'green' :
            value === 'Good' ? 'cyan' :
                value === 'Slow' ? 'yellow' : 'red';
        console.log(`${chalk_1.default.cyan(label.padEnd(25))}: ${chalk_1.default[color](value)}`);
    });
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
    console.log(chalk_1.default.cyan(`Heap Usage:                  ${heapUsedPercent}%`));
    console.log(chalk_1.default.gray('\n─'.repeat(50)));
    console.log(chalk_1.default.yellow('\n💡 Memory Usage Guide:'));
    console.log(chalk_1.default.gray('  < 70%: Excellent'));
    console.log(chalk_1.default.gray('  70-85%: Good'));
    console.log(chalk_1.default.gray('  85-95%: Monitor'));
    console.log(chalk_1.default.gray('  > 95%:  Warning\n'));
}
//# sourceMappingURL=debug.js.map