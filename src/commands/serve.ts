// /workspaces/mgzon-cli/src/commands/serve.ts
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
    
    // ✅ إضافة debug logs
    console.log(chalk.gray(`   Debug: Starting server on ${host}:${port}`));
    console.log(chalk.gray(`   Debug: Current directory: ${process.cwd()}`));
    
    // Check if Next.js exists
    const packagePath = path.join(process.cwd(), 'package.json');
    console.log(chalk.gray(`   Debug: Looking for package.json at: ${packagePath}`));
    
    if (!await fs.pathExists(packagePath)) {
      spinner.fail(chalk.red('package.json not found'));
      console.log(chalk.yellow('   Current path:', process.cwd()));
      console.log(chalk.yellow('   Package.json path:', packagePath));
      console.log(chalk.yellow('   Run this command from your project directory'));
      return;
    }

    const packageJson = await fs.readJson(packagePath);
    const isNextApp = packageJson.dependencies?.next || packageJson.devDependencies?.next;

    console.log(chalk.gray(`   Debug: Is Next.js app: ${isNextApp}`));
    console.log(chalk.gray(`   Debug: Package scripts: ${JSON.stringify(packageJson.scripts)}`));

    if (isNextApp) {
      console.log(chalk.gray(`   Debug: Starting Next.js dev server...`));
      
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
      console.log(chalk.yellow(`   Dependencies: ${JSON.stringify(packageJson.dependencies || {})}`));
      console.log(chalk.yellow(`   Dev Dependencies: ${JSON.stringify(packageJson.devDependencies || {})}`));
      console.log(chalk.yellow('   Run mz init first to create a Next.js app'));
    }

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to start server'));
    console.error(chalk.red('Error details:'), error.message);
    console.error(chalk.gray('Stack trace:'), error.stack);
  }
}