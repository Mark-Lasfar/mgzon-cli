// /workspaces/mgzon-cli/src/commands/build.ts
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
      console.log(chalk.yellow('   Add a "build" script to your package.json'));
      console.log(chalk.cyan('   Example: "build": "next build"'));
      return;
    }

    // Run build
    const buildCommand = 'npm run build';
    const env = { ...process.env, NODE_ENV: 'production' };
    
    if (options.analyze) {
      spinner.text = 'Building with analysis...';
      console.log(chalk.gray('   Debug: Using bundle analyzer'));
      
      // Check for @next/bundle-analyzer
      try {
        if (packageJson.scripts['build:analyze']) {
          execSync('npm run build:analyze', { stdio: 'inherit', cwd, env });
        } else {
          // If no analyze script, run regular build
          execSync(buildCommand, { stdio: 'inherit', cwd, env });
          console.log(chalk.yellow('   ⚠️  No analyze script found, using regular build'));
        }
      } catch {
        // Fallback to regular build
        execSync(buildCommand, { stdio: 'inherit', cwd, env });
      }
    } else {
      spinner.text = 'Building for production...';
      console.log(chalk.gray('   Debug: Running npm run build'));
      execSync(buildCommand, { stdio: 'inherit', cwd, env });
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
      console.log(chalk.green(`Node.js environment: ${env.NODE_ENV}`));
      
      if (buildStats.totalSize) {
        console.log(chalk.green(`Total size: ${Math.round(buildStats.totalSize / 1024 / 1024)} MB`));
      }
      
      if (buildStats.fileCount) {
        console.log(chalk.green(`Files: ${buildStats.fileCount}`));
      }
      
      // Check for common files
      const requiredFiles = ['BUILD_ID', 'static'];
      const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(buildPath, file)));
      
      if (missingFiles.length === 0) {
        console.log(chalk.green(`Status: ✅ Valid Next.js build`));
      } else {
        console.log(chalk.yellow(`Status: ⚠️  Missing files: ${missingFiles.join(', ')}`));
      }
      
      console.log(chalk.gray('─'.repeat(40)));
      
      console.log(chalk.yellow('\n🚀 Next Steps:'));
      console.log(chalk.cyan('   mz deploy                      # Deploy to MGZON'));
      console.log(chalk.cyan('   npx serve@latest .next         # Test locally'));
      console.log(chalk.cyan('   npx next start                 # Start production server\n'));
    } else {
      console.log(chalk.yellow('⚠️  Build directory not found: ' + buildDir));
      console.log(chalk.cyan('   Check your build configuration\n'));
    }

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Build failed'));
    console.error(chalk.red(`  Error: ${error.message}`));
    
    if (error.stderr) {
      const errorOutput = error.stderr.toString();
      console.error(chalk.red('  Build output:'));
      console.error(chalk.red(errorOutput.substring(0, 500) + '...'));
    }
    
    // Common error solutions
    console.log(chalk.cyan('\n💡 Common solutions:'));
    console.log(chalk.gray('   1. Run: npm install'));
    console.log(chalk.gray('   2. Check for TypeScript errors'));
    console.log(chalk.gray('   3. Ensure all dependencies are installed\n'));
  }
}

async function getBuildStats(buildPath: string): Promise<{ totalSize: number; fileCount: number }> {
  let totalSize = 0;
  let fileCount = 0;

  const collectStats = async (dir: string) => {
    try {
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
    } catch {
      // Ignore permission errors
    }
  };

  await collectStats(buildPath);
  
  return { totalSize, fileCount };
}