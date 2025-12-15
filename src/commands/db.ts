import chalk from 'chalk';
import ora from 'ora';
import { buildApiUrl, getAuthHeaders } from '../middleware/auth';
import axios from 'axios';
import inquirer from 'inquirer';

interface DatabaseStats {
  collections: number;
  objects: number;
  avgObjSize: number;
  dataSize: number;
  storageSize: number;
  indexes: number;
  indexSize: number;
  fileSize: number;
}

export async function dbCommand(options: any) {
  const spinner = ora('Processing...').start();

  try {
    const headers = await getAuthHeaders();

    if (options.migrate) {
      spinner.text = 'Running database migrations...';
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to run database migrations?',
          default: false
        }
      ]);
      
      if (!confirm) {
        spinner.fail(chalk.yellow('Migration cancelled'));
        return;
      }
      
      const response = await axios.post(await buildApiUrl('/db'), {
        operation: 'migrate'
      }, { headers });
      
      spinner.succeed(chalk.green('✅ Database migrations completed'));
      console.log(chalk.cyan(`\n  ${response.data.data.message}`));
      return;
    }

    if (options.seed) {
      spinner.text = 'Seeding database...';
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to seed the database?',
          default: false
        }
      ]);
      
      if (!confirm) {
        spinner.fail(chalk.yellow('Seed cancelled'));
        return;
      }
      
      const response = await axios.post(await buildApiUrl('/db'), {
        operation: 'seed'
      }, { headers });
      
      spinner.succeed(chalk.green('✅ Database seeded successfully'));
      console.log(chalk.cyan(`\n  ${response.data.data.message}`));
      console.log(chalk.cyan(`  Tables: ${response.data.data.tables?.join(', ')}`));
      return;
    }

    if (options.reset) {
      spinner.text = 'Resetting database...';
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '⚠️  DANGER: This will reset the database. Are you absolutely sure?',
          default: false
        }
      ]);
      
      if (!confirm) {
        spinner.fail(chalk.yellow('Database reset cancelled'));
        return;
      }
      
      const response = await axios.post(await buildApiUrl('/db'), {
        operation: 'reset'
      }, { headers });
      
      spinner.succeed(chalk.green('✅ Database reset completed'));
      console.log(chalk.cyan(`\n  ${response.data.data.message}`));
      console.log(chalk.yellow('⚠️  All data has been reset to defaults'));
      return;
    }

    if (options.status) {
      spinner.text = 'Checking database status...';
      
      const response = await axios.get(await buildApiUrl('/db'), { headers });
      const dbStats: DatabaseStats = response.data.data.database.stats;
      
      spinner.succeed(chalk.green('✅ Database status retrieved'));
      
      console.log(chalk.cyan('\n🗄️  Database Status\n'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`Collections: ${dbStats.collections}`));
      console.log(chalk.green(`Objects: ${dbStats.objects.toLocaleString()}`));
      console.log(chalk.green(`Data size: ${Math.round(dbStats.dataSize / 1024 / 1024)} MB`));
      console.log(chalk.green(`Storage size: ${Math.round(dbStats.storageSize / 1024 / 1024)} MB`));
      console.log(chalk.green(`Indexes: ${dbStats.indexes}`));
      console.log(chalk.green(`Index size: ${Math.round(dbStats.indexSize / 1024 / 1024)} MB`));
      console.log(chalk.green(`File size: ${Math.round(dbStats.fileSize / 1024 / 1024)} MB`));
      console.log(chalk.gray('─'.repeat(50)));
      
      const usagePercent = Math.round((dbStats.storageSize / dbStats.fileSize) * 100);
      const usageColor = usagePercent < 70 ? 'green' : usagePercent < 85 ? 'yellow' : 'red';
      
      console.log(chalk[usageColor](`\nStorage usage: ${usagePercent}%`));
      console.log(chalk.gray('─'.repeat(50)));
      return;
    }

    if (options.create) {
      const migrationName = options.create;
      
      if (!migrationName || migrationName.length < 3) {
        throw new Error('Migration name must be at least 3 characters');
      }

      spinner.text = 'Creating migration...';
      
      const response = await axios.post(await buildApiUrl('/db'), {
        operation: 'create-migration',
        name: migrationName
      }, { headers });
      
      spinner.succeed(chalk.green(`✅ Migration "${migrationName}" created`));
      console.log(chalk.cyan(`\n  ${response.data.data.message}`));
      console.log(chalk.cyan(`  File: ${response.data.data.filename}`));
      return;
    }

    // Default help
    spinner.stop();
    
    console.log(chalk.cyan('\n🗄️  Database Operations\n'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('Usage:'));
    console.log(chalk.yellow('  mz db --status                ') + chalk.gray('# Show database status'));
    console.log(chalk.yellow('  mz db --migrate               ') + chalk.gray('# Run migrations'));
    console.log(chalk.yellow('  mz db --seed                  ') + chalk.gray('# Seed database'));
    console.log(chalk.yellow('  mz db --create <name>         ') + chalk.gray('# Create new migration'));
    console.log(chalk.yellow('  mz db --reset                 ') + chalk.gray('# Reset database (DANGEROUS)\n'));
    console.log(chalk.yellow('⚠️  Warning: Database operations require admin privileges\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Database command failed'));
    
    if (error.response) {
      console.error(chalk.red(`  Error ${error.response.status}: ${error.response.data.error || 'API error'}`));
    } else {
      console.error(chalk.red(`  Error: ${error.message}`));
    }
  }
}
