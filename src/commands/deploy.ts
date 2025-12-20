// /workspaces/mgzon-cli/src/commands/deploy.ts
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream, existsSync } from 'fs';
import { tmpdir } from 'os';
import { getAuthHeaders, buildApiUrl } from '../middleware/auth';
import { getApiUrl } from '../utils/config';
import FormData from 'form-data';


interface DeployResponse {
  deploymentId: string;
  appId: string;
  appName: string;
  slug: string;
  version: string;
  environment: string;
  status: string;
  url?: string;
  deploymentUrl?: string;
  downloadUrl?: string;
  logs?: string[];
  nextSteps?: string[];
  timestamp?: string;
}

interface AppInfo {
  id: string;
  name: string;
  slug: string;
  environment: string;
  status: string;
  domains?: string[];
}

export async function deployCommand(options: any) {
  const spinner = ora('Preparing deployment...').start();

  try {
    // ⭐ إضافة debug log
    const apiUrl = await getApiUrl();
    console.log(chalk.gray(`   Debug: API URL: ${apiUrl}`));
    
    // Check if we're in a project directory
    const cwd = process.cwd();
    const packagePath = path.join(cwd, 'package.json');
    
    if (!existsSync(packagePath)) {
      spinner.fail(chalk.red('Not in a project directory'));
      console.log(chalk.yellow('Navigate to your project directory first'));
      console.log(chalk.yellow('Or run: mz init <project-name> to create a new project'));
      return;
    }

    // Read package.json
    const packageJson = await fs.readJson(packagePath);
    const projectName = packageJson.name || path.basename(cwd);
    const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    spinner.text = `Preparing ${projectName} for deployment...`;
    
    // Check for build directory
    const buildDir = options.buildDir || '.next';
    const buildPath = path.join(cwd, buildDir);
    
    // Auto-build if requested and build directory doesn't exist
    if (!existsSync(buildPath) && options.build !== false) {
      spinner.text = 'Building project...';
      
      try {
        const { execSync } = await import('child_process');
        
        // Check for build script
        if (packageJson.scripts?.build) {
          execSync('npm run build', { stdio: 'inherit', cwd });
          spinner.succeed(chalk.green('Build completed'));
          spinner.start('Creating deployment package...');
        } else if (packageJson.scripts?.['build:prod']) {
          execSync('npm run build:prod', { stdio: 'inherit', cwd });
          spinner.succeed(chalk.green('Build completed'));
          spinner.start('Creating deployment package...');
        } else {
          spinner.warn(chalk.yellow('No build script found, skipping build'));
          spinner.start('Creating deployment package...');
        }
      } catch (buildError: any) {
        spinner.fail(chalk.red('Build failed'));
        console.error(chalk.red(buildError.message));
        
        const { default: inquirer } = await import('inquirer');
        const { continueDeploy } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueDeploy',
            message: 'Continue deployment anyway?',
            default: false
          }
        ]);
        
        if (!continueDeploy) {
          return;
        }
        spinner.start('Creating deployment package...');
      }
    }

    // Create deployment package
    spinner.text = 'Creating deployment package...';
    console.log(chalk.gray(`   Debug: Creating package from: ${cwd}`));
    
    const zipBuffer = await createDeploymentPackage(cwd, buildDir);
    
    if (!zipBuffer || zipBuffer.length === 0) {
      spinner.fail(chalk.red('Failed to create deployment package'));
      console.log(chalk.yellow('No files to deploy. Make sure your project has content.'));
      return;
    }

    // Get app info
    const environment = options.env || 'staging';
    const version = packageJson.version || '1.0.0';
    const deployDescription = options.description || packageJson.description || `Deployment of ${projectName}`;
    
    let appId = options.appId;
    let appName = projectName;
    let appSlug = projectSlug;

    // Try to find .mgzon.json
    const mgzonConfigPath = path.join(cwd, '.mgzon.json');
    if (existsSync(mgzonConfigPath)) {
      try {
        const mgzonConfig = await fs.readJson(mgzonConfigPath);
        appId = appId || mgzonConfig.appId;
        appName = mgzonConfig.name || appName;
        appSlug = mgzonConfig.slug || appSlug;
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not read .mgzon.json config'));
      }
    }

    // If no appId, try to find existing app or create new one
    if (!appId) {
      spinner.text = 'Looking for existing app...';
      
      try {
        const headers = await getAuthHeaders();
        const appsResponse = await axios.get(await buildApiUrl('/apps'), { headers });
        
        if (appsResponse.data.success && appsResponse.data.data?.apps) {
          const apps: AppInfo[] = appsResponse.data.data.apps;
          const existingApp = apps.find(app => 
            app.name === appName || 
            app.slug === appSlug ||
            app.name.includes(projectName)
          );
          
          if (existingApp) {
            appId = existingApp.id;
            appName = existingApp.name;
            appSlug = existingApp.slug;
            spinner.succeed(chalk.green(`Found existing app: ${appName}`));
          } else {
            spinner.text = 'No existing app found';
          }
        }
      } catch (error) {
        spinner.text = 'Could not fetch apps list';
      }
      
      // Still no appId? Ask user
      if (!appId && !options.autoApprove) {
        spinner.stop();
        const { default: inquirer } = await import('inquirer');
        
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'No app found. What would you like to do?',
            choices: [
              { name: 'Create new app', value: 'create' },
              { name: 'Enter app ID manually', value: 'manual' },
              { name: 'Cancel deployment', value: 'cancel' }
            ],
            default: 'create'
          }
        ]);
        
        if (action === 'cancel') {
          spinner.fail(chalk.yellow('Deployment cancelled'));
          return;
        }
        
        if (action === 'manual') {
          const { manualAppId } = await inquirer.prompt([
            {
              type: 'input',
              name: 'manualAppId',
              message: 'Enter app ID:',
              validate: (input: string) => input.length > 0 || 'App ID is required'
            }
          ]);
          appId = manualAppId;
        } else if (action === 'create') {
          const { appName: newAppName } = await inquirer.prompt([
            {
              type: 'input',
              name: 'appName',
              message: 'App name:',
              default: appName,
              validate: (input: string) => input.length > 0 || 'App name is required'
            }
          ]);
          
          spinner.start('Creating new app...');
          try {
            const headers = await getAuthHeaders();
            const createResponse = await axios.post(await buildApiUrl('/apps'), {
              name: newAppName,
              description: deployDescription,
              environment: environment,
              targetAudience: 'DEVELOPER'
            }, { headers });
            
            if (createResponse.data.success) {
              appId = createResponse.data.data._id || createResponse.data.data.id;
              appName = newAppName;
              spinner.succeed(chalk.green(`App created: ${appName}`));
            } else {
              throw new Error(createResponse.data.error || 'Failed to create app');
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Failed to create app'));
            console.error(chalk.red(error.message));
            return;
          }
        }
        
        spinner.start('Continuing deployment...');
      }
    }

    if (!appId) {
      spinner.fail(chalk.red('App ID is required'));
      console.log(chalk.yellow('Please specify app ID with:'));
      console.log(chalk.cyan('  mz deploy --app-id=<id>'));
      console.log(chalk.cyan('  Or create .mgzon.json with appId field'));
      console.log(chalk.cyan('  Or create app first: mz apps --create <name>'));
      return;
    }

    // Show deployment summary
    spinner.stop();
    
    console.log(chalk.cyan('\n' + '═'.repeat(60)));
    console.log(chalk.bold('📦 Deployment Summary'));
    console.log(chalk.cyan('═'.repeat(60)));
    console.log(chalk.green(`Project:    ${projectName}`));
    console.log(chalk.green(`App:        ${appName} (${appId.slice(0, 8)}...)`));
    console.log(chalk.green(`Version:    ${version}`));
    console.log(chalk.green(`Environment: ${environment}`));
    console.log(chalk.green(`Package size: ${Math.round(zipBuffer.length / 1024 / 1024 * 100) / 100} MB`));
    console.log(chalk.cyan('═'.repeat(60)));
    
    // Confirm deployment
    if (!options.autoApprove) {
      const { default: inquirer } = await import('inquirer');
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Proceed with deployment?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Deployment cancelled'));
        return;
      }
    }
    
    spinner.start('Uploading to MGZON...');

    // Upload to MGZON
    spinner.text = 'Uploading deployment package...';
    
    const headers = await getAuthHeaders();
    
    // Create FormData
    const formData = new FormData();
    
    // Add file
    const fileBlob = new Blob([new Uint8Array(zipBuffer)], { type: 'application/zip' });
    formData.append('file', fileBlob, 'deployment.zip');
    
    // Add metadata
    formData.append('appId', appId);
    formData.append('appName', appName);
    formData.append('environment', environment);
    formData.append('version', version);
    formData.append('type', 'nextjs');
    
    // Detect framework
    const isNextJS = !!packageJson.dependencies?.next || !!packageJson.devDependencies?.next;
    const isReact = !!packageJson.dependencies?.react;
    
    if (isNextJS) {
      formData.append('framework', 'nextjs');
      formData.append('buildCommand', packageJson.scripts?.build || 'next build');
    } else if (isReact) {
      formData.append('framework', 'react');
      formData.append('buildCommand', packageJson.scripts?.build || 'react-scripts build');
    } else {
      formData.append('framework', 'static');
    }
    
    // Add optional fields
    if (deployDescription) {
      formData.append('description', deployDescription);
    }
    
    if (packageJson.repository?.url) {
      formData.append('repositoryUrl', packageJson.repository.url);
    }
    
    if (options.buildCommand) {
      formData.append('buildCommand', options.buildCommand);
    }
    
    if (options.installCommand) {
      formData.append('installCommand', options.installCommand);
    }
    
    if (options.outputDirectory) {
      formData.append('outputDirectory', options.outputDirectory);
    }

    // ⭐ إضافة debug log للـ URL
    const deployUrl = await buildApiUrl('/deploy');
    console.log(chalk.gray(`   Debug: Deploy URL: ${deployUrl}`));

    // Send deployment request
    spinner.text = 'Deploying...';
    
    try {
      const response = await axios.post<{ 
        success: boolean; 
        data: DeployResponse; 
        message?: string;
        error?: string;
        timestamp?: string;
      }>(
        deployUrl,
        formData,
        {
          headers: {
            'Authorization': headers.Authorization,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 300000 // 5 minutes timeout for large deployments
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || response.data.message || 'Deployment failed');
      }

      const deployData = response.data.data;
      
      spinner.succeed(chalk.green('✅ Deployment successful!'));
      
      console.log(chalk.cyan('\n' + '═'.repeat(60)));
      console.log(chalk.bold('🚀 Deployment Complete'));
      console.log(chalk.cyan('═'.repeat(60)));
      console.log(chalk.green(`Deployment ID: ${deployData.deploymentId}`));
      console.log(chalk.green(`App: ${deployData.appName}`));
      console.log(chalk.green(`Version: ${deployData.version}`));
      console.log(chalk.green(`Environment: ${deployData.environment}`));
      console.log(chalk.green(`Status: ${deployData.status}`));
      
      if (deployData.url) {
        console.log(chalk.green(`URL: ${deployData.url}`));
      }
      
      console.log(chalk.cyan('═'.repeat(60)));
      
      // Show logs if available
      if (deployData.logs && deployData.logs.length > 0) {
        console.log(chalk.cyan('\n📋 Deployment Logs:'));
        deployData.logs.forEach((log, index) => {
          console.log(chalk.gray(`  ${index + 1}. ${log}`));
        });
      }
      
      // Show next steps
      if (deployData.nextSteps && deployData.nextSteps.length > 0) {
        console.log(chalk.cyan('\n👉 Next Steps:'));
        deployData.nextSteps.forEach((step, index) => {
          console.log(chalk.yellow(`  ${index + 1}. ${step}`));
        });
      }
      
      console.log(chalk.cyan('\n' + '═'.repeat(60)));
      
      // Helpful commands
      console.log(chalk.cyan('🔧 Useful Commands:'));
      console.log(chalk.yellow(`  mz apps --info ${deployData.appId}`));
      console.log(chalk.yellow(`  mz apps --logs ${deployData.appId}`));
      
      if (deployData.downloadUrl) {
        console.log(chalk.yellow(`  curl -O ${deployData.downloadUrl}`));
      }
      
      console.log(chalk.cyan('\n' + '═'.repeat(60) + '\n'));

    } catch (uploadError: any) {
      throw uploadError;
    }

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Deployment failed'));
    
    console.log(chalk.red('\n' + '─'.repeat(50)));
    
    if (error.response) {
      const errorData = error.response.data;
      console.error(chalk.red(`Status: ${error.response.status}`));
      
      if (errorData?.error) {
        console.error(chalk.red(`Error: ${errorData.error}`));
      }
      
      if (errorData?.message) {
        console.error(chalk.red(`Message: ${errorData.message}`));
      }
      
      if (errorData?.details) {
        console.error(chalk.red(`Details: ${errorData.details}`));
      }
      
      // Show URL that failed
      console.log(chalk.gray(`URL: ${error.config?.url || 'Unknown'}`));
    } else if (error.code === 'ECONNREFUSED') {
      console.error(chalk.red('Cannot connect to MGZON API'));
      console.log(chalk.yellow('Make sure the server is running at:'));
      console.log(chalk.cyan(`  ${await getApiUrl()}`));
      console.log(chalk.yellow('\nTry:'));
      console.log(chalk.cyan('  mz config --set apiUrl=http://localhost:3000/api/v1'));
    } else if (error.code === 'ETIMEDOUT') {
      console.error(chalk.red('Request timed out'));
      console.log(chalk.yellow('The server is taking too long to respond'));
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
      
      if (error.stack && process.env.DEBUG) {
        console.error(chalk.gray(error.stack));
      }
    }
    
    console.log(chalk.red('─'.repeat(50)));
    
    console.log(chalk.yellow('\n💡 Troubleshooting:'));
    console.log(chalk.cyan('  1. Check authentication: mz whoami'));
    console.log(chalk.cyan('  2. Check API URL: mz config --get apiUrl'));
    console.log(chalk.cyan('  3. Verify app exists: mz apps --list'));
    console.log(chalk.cyan('  4. Check network connection'));
    console.log(chalk.cyan('  5. Enable debug mode: DEBUG=1 mz deploy\n'));
  }
}

async function createDeploymentPackage(projectDir: string, buildDir: string): Promise<Buffer> {
  console.log(chalk.gray(`   Debug: Creating deployment package from: ${projectDir}`));
  
  return new Promise((resolve, reject) => {
    const tempFile = path.join(tmpdir(), `mgzon-deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.zip`);
    const output = createWriteStream(tempFile);
    const archive = archiver('zip', { 
      zlib: { level: 9 },
      comment: `MGZON Deployment - ${new Date().toISOString()}`
    });

    let totalSize = 0;
    let fileCount = 0;

    output.on('close', async () => {
      try {
        console.log(chalk.gray(`   Debug: Package created: ${totalSize} bytes, ${fileCount} files`));
        const buffer = await fs.readFile(tempFile);
        await fs.remove(tempFile);
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.log(chalk.yellow(`   Warning: ${err.message}`));
      } else {
        reject(err);
      }
    });

    archive.on('error', reject);
    archive.on('entry', (entry) => {
      fileCount++;
      if (entry.stats) {
        totalSize += entry.stats.size;
      }
    });
    
    archive.pipe(output);

    // Add build directory if exists
    const buildPath = path.join(projectDir, buildDir);
    if (existsSync(buildPath)) {
      archive.directory(buildPath, buildDir);
      console.log(chalk.gray(`   Debug: Added build directory: ${buildDir}`));
    } else {
      console.log(chalk.yellow(`   Warning: Build directory not found: ${buildDir}`));
    }

    // Add public directory if exists
    const publicPath = path.join(projectDir, 'public');
    if (existsSync(publicPath)) {
      archive.directory(publicPath, 'public');
      console.log(chalk.gray(`   Debug: Added public directory`));
    }

    // Always add package.json
    const packagePath = path.join(projectDir, 'package.json');
    if (existsSync(packagePath)) {
      archive.file(packagePath, { name: 'package.json' });
      console.log(chalk.gray(`   Debug: Added package.json`));
    }

    // Add .mgzon.json if exists
    const mgzonConfigPath = path.join(projectDir, '.mgzon.json');
    if (existsSync(mgzonConfigPath)) {
      archive.file(mgzonConfigPath, { name: '.mgzon.json' });
      console.log(chalk.gray(`   Debug: Added .mgzon.json`));
    }

    // Add README if exists
    const readmePath = path.join(projectDir, 'README.md');
    if (existsSync(readmePath)) {
      archive.file(readmePath, { name: 'README.md' });
    }

    // Add configuration files
    const configFiles = [
      'next.config.js',
      'next.config.mjs',
      'next.config.ts',
      'vite.config.js',
      'vite.config.ts',
      'webpack.config.js',
      'rollup.config.js',
      '.env',
      '.env.local',
      '.env.production'
    ];

    configFiles.forEach(configFile => {
      const configPath = path.join(projectDir, configFile);
      if (existsSync(configPath)) {
        archive.file(configPath, { name: configFile });
        console.log(chalk.gray(`   Debug: Added ${configFile}`));
      }
    });

    // Add .next directory files for Next.js
    const nextStaticPath = path.join(projectDir, '.next', 'static');
    if (existsSync(nextStaticPath)) {
      archive.directory(nextStaticPath, '.next/static');
      console.log(chalk.gray(`   Debug: Added .next/static directory`));
    }

    archive.finalize();
  });
}