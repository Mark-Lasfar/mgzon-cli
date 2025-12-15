"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
async function initCommand(projectName, options) {
    const spinner = (0, ora_1.default)('Creating MGZON app...').start();
    try {
        const projectDir = path_1.default.join(process.cwd(), projectName || 'mgzon-app');
        await fs_extra_1.default.ensureDir(projectDir);
        const template = options.template || 'nextjs';
        const templatePath = path_1.default.join(__dirname, '../../templates', template);
        if (await fs_extra_1.default.pathExists(templatePath)) {
            await fs_extra_1.default.copy(templatePath, projectDir);
        }
        else {
            await createBasicStructure(projectDir, options);
        }
        spinner.succeed(chalk_1.default.green('MGZON app created successfully!'));
        console.log('\n' + chalk_1.default.bold('Next steps:'));
        console.log(chalk_1.default.cyan(`  cd ${projectName || 'mgzon-app'}`));
        console.log(chalk_1.default.cyan('  npm install'));
        console.log(chalk_1.default.cyan('  mz serve\n'));
        console.log(chalk_1.default.bold('Documentation:'));
        console.log(chalk_1.default.blue('  https://developers.mgzon.com/docs\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to create app'));
        console.error(error);
    }
}
async function createBasicStructure(projectDir, options) {
    const structure = {
        'package.json': JSON.stringify({
            name: path_1.default.basename(projectDir),
            version: '1.0.0',
            private: true,
            scripts: {
                dev: 'mz serve',
                build: 'next build',
                start: 'next start',
                deploy: 'mz deploy'
            },
            dependencies: {
                '@mgzon/sdk': '^1.0.0',
                react: '^18.2.0',
                'react-dom': '^18.2.0',
                next: '^13.4.0'
            }
        }, null, 2),
        'mgzon.config.json': JSON.stringify({
            name: path_1.default.basename(projectDir),
            version: '1.0.0',
            description: 'MGZON App',
            permissions: ['read_products', 'write_products'],
            webhooks: options.withWebhooks ? ['order.created', 'product.updated'] : []
        }, null, 2),
        'src/app/page.tsx': `export default function Home() {
  return (
    <div>
      <h1>Welcome to MGZON App</h1>
    </div>
  );
}`,
        '.env.local': 'MGZON_API_KEY=your_api_key_here'
    };
    for (const [filePath, content] of Object.entries(structure)) {
        await fs_extra_1.default.outputFile(path_1.default.join(projectDir, filePath), content);
    }
}
//# sourceMappingURL=init.js.map