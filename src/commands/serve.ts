//src/commands/serve.ts
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

export async function serveCommand(options: any) {
  const spinner = ora('Starting development server...').start();

  try {
    const port = options.port || 3000;
    const host = options.host || 'localhost';
    
    // Check if Next.js exists
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!await fs.pathExists(packagePath)) {
      spinner.fail(chalk.red('package.json not found'));
      console.log(chalk.yellow('Run this command from your project directory'));
      return;
    }

    const packageJson = await fs.readJson(packagePath);
    const isNextApp = packageJson.dependencies?.next || packageJson.devDependencies?.next;

    if (isNextApp) {
      // Start Next.js dev server
      const server = spawn('npx', ['next', 'dev', '-p', port, '-H', host], {
        stdio: 'inherit',
        shell: true
      });

      spinner.succeed(chalk.green(`Development server started on http://${host}:${port}`));
      
      console.log('\n' + chalk.bold('Webhook Testing:'));
      if (options.webhookUrl) {
        console.log(chalk.cyan(`  Webhook URL: ${options.webhookUrl}`));
        console.log(chalk.cyan('  Use mz webhook --simulate to test\n'));
      }

      // Handle server termination
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\nStopping server...'));
        server.kill();
        process.exit(0);
      });

    } else {
      spinner.fail(chalk.red('Next.js not found in dependencies'));
      console.log(chalk.yellow('Run mz init first to create a Next.js app'));
    }

  } catch (error) {
    spinner.fail(chalk.red('Failed to start server'));
    console.error(error);
  }
}
