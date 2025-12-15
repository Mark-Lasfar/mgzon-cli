// /commands/init.ts
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

export async function initCommand(projectName: string, options: any) {
  const spinner = ora('Creating MGZON app...').start();

  try {
    // Create project directory
    const projectDir = path.join(process.cwd(), projectName || 'mgzon-app');
    await fs.ensureDir(projectDir);

    // Copy template
    const template = options.template || 'nextjs';
    const templatePath = path.join(__dirname, '../../templates', template);
    
    if (await fs.pathExists(templatePath)) {
      await fs.copy(templatePath, projectDir);
    } else {
      // Create basic structure
      await createBasicStructure(projectDir, options);
    }

    spinner.succeed(chalk.green('MGZON app created successfully!'));
    
    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.cyan(`  cd ${projectName || 'mgzon-app'}`));
    console.log(chalk.cyan('  npm install'));
    console.log(chalk.cyan('  mz serve\n'));
    
    console.log(chalk.bold('Documentation:'));
    console.log(chalk.blue('  https://developers.mgzon.com/docs\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to create app'));
    console.error(error);
  }
}

async function createBasicStructure(projectDir: string, options: any) {
  const structure = {
    'package.json': JSON.stringify({
      name: path.basename(projectDir),
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
      name: path.basename(projectDir),
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
    await fs.outputFile(path.join(projectDir, filePath), content);
  }
}
