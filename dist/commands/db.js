"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbCommand = dbCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const auth_1 = require("../middleware/auth");
const axios_1 = __importDefault(require("axios"));
const inquirer_1 = __importDefault(require("inquirer"));
async function dbCommand(options) {
    const spinner = (0, ora_1.default)('Processing...').start();
    try {
        const headers = await (0, auth_1.getAuthHeaders)();
        if (options.migrate) {
            spinner.text = 'Running database migrations...';
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Are you sure you want to run database migrations?',
                    default: false
                }
            ]);
            if (!confirm) {
                spinner.fail(chalk_1.default.yellow('Migration cancelled'));
                return;
            }
            const response = await axios_1.default.post(await (0, auth_1.buildApiUrl)('/db'), {
                operation: 'migrate'
            }, { headers });
            spinner.succeed(chalk_1.default.green('✅ Database migrations completed'));
            console.log(chalk_1.default.cyan(`\n  ${response.data.data.message}`));
            return;
        }
        if (options.seed) {
            spinner.text = 'Seeding database...';
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Are you sure you want to seed the database?',
                    default: false
                }
            ]);
            if (!confirm) {
                spinner.fail(chalk_1.default.yellow('Seed cancelled'));
                return;
            }
            const response = await axios_1.default.post(await (0, auth_1.buildApiUrl)('/db'), {
                operation: 'seed'
            }, { headers });
            spinner.succeed(chalk_1.default.green('✅ Database seeded successfully'));
            console.log(chalk_1.default.cyan(`\n  ${response.data.data.message}`));
            console.log(chalk_1.default.cyan(`  Tables: ${response.data.data.tables?.join(', ')}`));
            return;
        }
        if (options.reset) {
            spinner.text = 'Resetting database...';
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: '⚠️  DANGER: This will reset the database. Are you absolutely sure?',
                    default: false
                }
            ]);
            if (!confirm) {
                spinner.fail(chalk_1.default.yellow('Database reset cancelled'));
                return;
            }
            const response = await axios_1.default.post(await (0, auth_1.buildApiUrl)('/db'), {
                operation: 'reset'
            }, { headers });
            spinner.succeed(chalk_1.default.green('✅ Database reset completed'));
            console.log(chalk_1.default.cyan(`\n  ${response.data.data.message}`));
            console.log(chalk_1.default.yellow('⚠️  All data has been reset to defaults'));
            return;
        }
        if (options.status) {
            spinner.text = 'Checking database status...';
            const response = await axios_1.default.get(await (0, auth_1.buildApiUrl)('/db'), { headers });
            const dbStats = response.data.data.database.stats;
            spinner.succeed(chalk_1.default.green('✅ Database status retrieved'));
            console.log(chalk_1.default.cyan('\n🗄️  Database Status\n'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(`Collections: ${dbStats.collections}`));
            console.log(chalk_1.default.green(`Objects: ${dbStats.objects.toLocaleString()}`));
            console.log(chalk_1.default.green(`Data size: ${Math.round(dbStats.dataSize / 1024 / 1024)} MB`));
            console.log(chalk_1.default.green(`Storage size: ${Math.round(dbStats.storageSize / 1024 / 1024)} MB`));
            console.log(chalk_1.default.green(`Indexes: ${dbStats.indexes}`));
            console.log(chalk_1.default.green(`Index size: ${Math.round(dbStats.indexSize / 1024 / 1024)} MB`));
            console.log(chalk_1.default.green(`File size: ${Math.round(dbStats.fileSize / 1024 / 1024)} MB`));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            const usagePercent = Math.round((dbStats.storageSize / dbStats.fileSize) * 100);
            const usageColor = usagePercent < 70 ? 'green' : usagePercent < 85 ? 'yellow' : 'red';
            console.log(chalk_1.default[usageColor](`\nStorage usage: ${usagePercent}%`));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            return;
        }
        if (options.create) {
            const migrationName = options.create;
            if (!migrationName || migrationName.length < 3) {
                throw new Error('Migration name must be at least 3 characters');
            }
            spinner.text = 'Creating migration...';
            const response = await axios_1.default.post(await (0, auth_1.buildApiUrl)('/db'), {
                operation: 'create-migration',
                name: migrationName
            }, { headers });
            spinner.succeed(chalk_1.default.green(`✅ Migration "${migrationName}" created`));
            console.log(chalk_1.default.cyan(`\n  ${response.data.data.message}`));
            console.log(chalk_1.default.cyan(`  File: ${response.data.data.filename}`));
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.cyan('\n🗄️  Database Operations\n'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('Usage:'));
        console.log(chalk_1.default.yellow('  mz db --status                ') + chalk_1.default.gray('# Show database status'));
        console.log(chalk_1.default.yellow('  mz db --migrate               ') + chalk_1.default.gray('# Run migrations'));
        console.log(chalk_1.default.yellow('  mz db --seed                  ') + chalk_1.default.gray('# Seed database'));
        console.log(chalk_1.default.yellow('  mz db --create <name>         ') + chalk_1.default.gray('# Create new migration'));
        console.log(chalk_1.default.yellow('  mz db --reset                 ') + chalk_1.default.gray('# Reset database (DANGEROUS)\n'));
        console.log(chalk_1.default.yellow('⚠️  Warning: Database operations require admin privileges\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Database command failed'));
        if (error.response) {
            console.error(chalk_1.default.red(`  Error ${error.response.status}: ${error.response.data.error || 'API error'}`));
        }
        else {
            console.error(chalk_1.default.red(`  Error: ${error.message}`));
        }
    }
}
//# sourceMappingURL=db.js.map