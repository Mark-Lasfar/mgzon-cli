import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream, existsSync } from 'fs';
import { tmpdir } from 'os';
import { getAuthHeaders, buildApiUrl } from '../middleware/auth';

interface DeployResponse {
  deploymentId: string;
  appId: string;
  appName: string;
  slug: string;
  version: string;
  environment: string;
  status: string;
  url: string;
  deploymentUrl: string;
  downloadUrl: string;
  logs: string[];
  nextSteps: string[];
}

export async function deployCommand(options: any) {
  const spinner = ora('Preparing deployment...').start();

  try {
    // Check if we're in a project directory
    const cwd = process.cwd();
    const packagePath = path.join(cwd, 'package.json');
    
    if (!existsSync(packagePath)) {
      spinner.fail(chalk.red('Not in a project directory'));
      console.log(chalk.yellow('Navigate to your project directory first'));
      return;
    }

    // Read package.json
    const packageJson = await fs.readJson(packagePath);
    const projectName = packageJson.name || path.basename(cwd);
    
    // Check for build directory
    const buildDir = options.buildDir || '.next';
    const buildPath = path.join(cwd, buildDir);
    
    if (!existsSync(buildPath) && options.build !== false) {
      spinner.text = 'Building project...';
      
      try {
        const { execSync } = await import('child_process');
        
        // Check build script
        if (packageJson.scripts?.build) {
          execSync('npm run build', { stdio: 'inherit', cwd });
        } else if (packageJson.scripts?.['build:prod']) {

          execSync('npm run build:prod', { stdio: 'inherit', cwd });
        } else {
          spinner.warn(chalk.yellow('No build script found'));
        }
      } catch (buildError: any) {
        spinner.fail(chalk.red('Build failed'));
        console.error(chalk.red(buildError.message));
        return;
      }
    }

    // Create deployment package
    spinner.text = 'Creating deployment package...';
    const zipBuffer = await createDeploymentPackage(cwd, buildDir);
    
    if (!zipBuffer || zipBuffer.length === 0) {
      spinner.fail(chalk.red('Failed to create deployment package'));
      return;
    }

    // Get app info if appId is not provided
    let appId = options.appId;
    const environment = options.env || 'production';
    const version = packageJson.version || '1.0.0';
    
    if (!appId) {
      // Try to find .mgzon.json
      const mgzonConfigPath = path.join(cwd, '.mgzon.json');
      if (existsSync(mgzonConfigPath)) {
        const mgzonConfig = await fs.readJson(mgzonConfigPath);
        appId = mgzonConfig.appId;
      }
      
      if (!appId) {
        spinner.fail(chalk.red('App ID not found'));
        console.log(chalk.yellow('Please specify app ID with --app-id=<id>'));
        console.log(chalk.yellow('Or create an app first with: mz apps --create'));
        return;
      }
    }

    // Confirm deployment
    if (!options.autoApprove) {
      spinner.stop();
      const { default: inquirer } = await import('inquirer');
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Deploy ${projectName} v${version} to ${environment}?`,
          default: false
        }
      ]);

      if (!confirm) {
        spinner.fail(chalk.yellow('Deployment cancelled'));
        return;
      }
      spinner.start('Deploying...');
    }

    // Upload to MGZON
    spinner.text = 'Uploading to MGZON...';
    
    const headers = await getAuthHeaders();
    const formData = new FormData();
    
    // Create file blob
    const fileBlob = new Blob([zipBuffer], { type: 'application/zip' });
    formData.append('file', fileBlob, 'deployment.zip');
    
    // Add metadata
    formData.append('appId', appId);
    formData.append('appName', projectName);
    formData.append('environment', environment);
    formData.append('version', version);
    formData.append('type', 'nextjs'); // Can detect this from package.json
    
    // Add optional fields
    if (packageJson.description) {
      formData.append('description', packageJson.description);
    }
    
    if (options.buildCommand) {
      formData.append('buildCommand', options.buildCommand);
    }

    // Send deployment request
    const response = await axios.post<{ success: boolean; data: DeployResponse; error?: string }>(
      await buildApiUrl('/deploy'),
      formData,
      {
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Deployment failed');
    }

    const deployData = response.data.data;
    
    spinner.succeed(chalk.green('✅ App deployed successfully!'));
    
    console.log(chalk.cyan('\n' + '─'.repeat(50)));
    console.log(chalk.bold('🚀 Deployment Details'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.green(`App:        ${deployData.appName}`));
    console.log(chalk.green(`Version:    ${deployData.version}`));
    console.log(chalk.green(`Environment: ${deployData.environment}`));
    console.log(chalk.green(`Status:     ${deployData.status}`));
    console.log(chalk.green(`Deployment ID: ${deployData.deploymentId}`));
    
    if (deployData.url) {
      console.log(chalk.green(`URL:        ${deployData.url}`));
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    
    if (deployData.logs && deployData.logs.length > 0) {
      console.log(chalk.cyan('\n📋 Deployment Logs:'));
      deployData.logs.forEach((log, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${log}`));
      });
    }
    
    if (deployData.nextSteps && deployData.nextSteps.length > 0) {
      console.log(chalk.cyan('\n👉 Next Steps:'));
      deployData.nextSteps.forEach((step, index) => {
        console.log(chalk.yellow(`  ${index + 1}. ${step}`));
      });
    }
    
    console.log(chalk.gray('\n' + '─'.repeat(50)));
    console.log(chalk.cyan('📊 View deployment status:'));
    console.log(chalk.yellow(`  mz apps --logs ${deployData.appId}`));
    console.log(chalk.cyan('🔗 Download deployment:'));
    console.log(chalk.yellow(`  ${deployData.downloadUrl}\n`));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Deployment failed'));
    
    if (error.response) {
      const errorData = error.response.data;
      console.error(chalk.red(`  Error ${error.response.status}: ${errorData?.error || errorData?.message || 'API error'}`));
      
      if (errorData?.details) {
        console.error(chalk.red(`  Details: ${errorData.details}`));
      }
    } else {
      console.error(chalk.red(`  Error: ${error.message}`));
    }
    
    console.log(chalk.yellow('\n💡 Troubleshooting:'));
    console.log(chalk.cyan('  1. Check your API key: mz whoami'));
    console.log(chalk.cyan('  2. Verify app exists: mz apps --list'));
    console.log(chalk.cyan('  3. Check network connection\n'));
  }
}

async function createDeploymentPackage(projectDir: string, buildDir: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(tmpdir(), `mgzon-deploy-${Date.now()}.zip`);
    const output = createWriteStream(tempFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      try {
        const buffer = await fs.readFile(tempFile);
        await fs.remove(tempFile);
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Add build directory
    const buildPath = path.join(projectDir, buildDir);
    if (existsSync(buildPath)) {
      archive.directory(buildPath, buildDir);
    }

    // Add public directory
    const publicPath = path.join(projectDir, 'public');
    if (existsSync(publicPath)) {
      archive.directory(publicPath, 'public');
    }

    // Add package.json
    const packagePath = path.join(projectDir, 'package.json');
    if (existsSync(packagePath)) {
      archive.file(packagePath, { name: 'package.json' });
    }

    // Add .mgzon.json if exists
    const mgzonConfigPath = path.join(projectDir, '.mgzon.json');
    if (existsSync(mgzonConfigPath)) {
      archive.file(mgzonConfigPath, { name: '.mgzon.json' });
    }

    // Add next.config.js if exists
    const nextConfigPath = path.join(projectDir, 'next.config.js');
    if (existsSync(nextConfigPath)) {
      archive.file(nextConfigPath, { name: 'next.config.js' });
    }

    archive.finalize();
  });
}
