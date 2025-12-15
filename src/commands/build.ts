import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export async function buildCommand(options: any) {
  const spinner = ora('Building project...').start();

  try {
    const cwd = process.cwd();
    const packagePath = path.join(cwd, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      spinner.fail(chalk.red('package.json not found'));
      console.log(chalk.yellow('Run this command from your project directory'));
      return;
    }

    const packageJson = await fs.readJson(packagePath);
    
    // Check build script
    if (!packageJson.scripts?.build) {
      spinner.fail(chalk.red('No build script found in package.json'));
      return;
    }

    // Run build
    const buildCommand = 'npm run build';
    
    if (options.analyze) {
      spinner.text = 'Building with analysis...';
      
      // Check for @next/bundle-analyzer
      try {
        execSync('npm run build:analyze', { stdio: 'inherit', cwd });
      } catch {
        // Fallback to regular build
        execSync(buildCommand, { stdio: 'inherit', cwd });
      }
    } else {
      execSync(buildCommand, { stdio: 'inherit', cwd });
    }

    spinner.succeed(chalk.green('✅ Build completed successfully!'));
    
    // Check build output
    const buildDir = options.outputDirectory || '.next';
    const buildPath = path.join(cwd, buildDir);
    
    if (fs.existsSync(buildPath)) {
      const buildStats = await getBuildStats(buildPath);
      
      console.log(chalk.cyan('\n📊 Build Statistics\n'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.green(`Output directory: ${buildDir}`));
      
      if (buildStats.totalSize) {
        console.log(chalk.green(`Total size: ${Math.round(buildStats.totalSize / 1024 / 1024)} MB`));
      }
      
      if (buildStats.fileCount) {
        console.log(chalk.green(`Files: ${buildStats.fileCount}`));
      }
      
      console.log(chalk.gray('─'.repeat(40)));
      
      console.log(chalk.yellow('\n🚀 Next: Deploy your app with:'));
      console.log(chalk.cyan('  mz deploy\n'));
    }

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Build failed'));
    console.error(chalk.red(`  Error: ${error.message}`));
    
    if (error.stderr) {
      console.error(chalk.red(`  ${error.stderr.toString()}`));
    }
  }
}

async function getBuildStats(buildPath: string): Promise<{ totalSize: number; fileCount: number }> {
  let totalSize = 0;
  let fileCount = 0;

  const collectStats = async (dir: string) => {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await collectStats(filePath);
      } else {
        totalSize += stat.size;
        fileCount++;
      }
    }
  };

  await collectStats(buildPath);
  
  return { totalSize, fileCount };
}
