// /src/commands/generate.ts
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';


async function generateWebhook(name: string, baseDir: string) {
  const webhooksDir = path.join(baseDir, 'src', 'webhooks');
  await fs.ensureDir(webhooksDir);

  const webhookContent = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  
  console.log('Webhook received:', payload);
  
  // Process webhook here
  
  return NextResponse.json({ received: true });
}
`;

  await fs.writeFile(path.join(webhooksDir, `${name}.ts`), webhookContent);
  console.log(chalk.cyan(`  Webhook created: src/webhooks/${name}.ts`));
}



export async function generateCommand(type: string, options: any) {
  const spinner = ora(`Generating ${type}...`).start();

  try {
    const name = options.name || 'unnamed';
    const baseDir = process.cwd();

    switch (type.toLowerCase()) {
      case 'model':
        await generateModel(name, options.fields, baseDir);
        break;
      
      case 'component':
        await generateComponent(name, baseDir);
        break;
      
      case 'api':
        await generateApi(name, baseDir);
        break;
      
      case 'webhook':
        await generateWebhook(name, baseDir);
        break;
      
      default:
        spinner.fail(chalk.red(`Unknown type: ${type}`));
        console.log(chalk.yellow('Available types: model, component, api, webhook'));
        return;
    }

    spinner.succeed(chalk.green(`${type} generated successfully!`));
    
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to generate ${type}`));
    console.error(chalk.red(error.message));
  }
}

async function generateModel(name: string, fields: string, baseDir: string) {
  const modelsDir = path.join(baseDir, 'src', 'models');
  await fs.ensureDir(modelsDir);

  const fieldDefinitions = parseFields(fields);
  
  const modelContent = `import mongoose from 'mongoose';

const ${name}Schema = new mongoose.Schema({
  ${fieldDefinitions.map(f => `${f.name}: ${f.type}`).join(',\n  ')}
}, {
  timestamps: true
});

export default mongoose.models.${name} || mongoose.model('${name}', ${name}Schema);
`;

  await fs.writeFile(path.join(modelsDir, `${name}.ts`), modelContent);
  console.log(chalk.cyan(`  Model created: src/models/${name}.ts`));
}

async function generateComponent(name: string, baseDir: string) {
  const componentsDir = path.join(baseDir, 'src', 'components');
  await fs.ensureDir(componentsDir);

  const componentContent = `'use client';

import { cn } from '@/lib/utils';

interface ${name}Props {
  className?: string;
}

export default function ${name}({ className }: ${name}Props) {
  return (
    <div className={cn('', className)}>
      <h2>${name} Component</h2>
    </div>
  );
}
`;

  await fs.writeFile(path.join(componentsDir, `${name}.tsx`), componentContent);
  console.log(chalk.cyan(`  Component created: src/components/${name}.tsx`));
}

async function generateApi(name: string, baseDir: string) {
  const apiDir = path.join(baseDir, 'src', 'app', 'api', name);
  await fs.ensureDir(apiDir);

  const routeContent = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: '${name} API endpoint',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    message: '${name} created',
    data: body
  });
}
`;

  await fs.writeFile(path.join(apiDir, 'route.ts'), routeContent);
  console.log(chalk.cyan(`  API created: src/app/api/${name}/route.ts`));
}

function parseFields(fieldsString: string): Array<{name: string, type: string}> {
  if (!fieldsString) return [{ name: 'name', type: 'String' }];
  
  return fieldsString.split(',').map(field => {
    const [name, type] = field.split(':').map(s => s.trim());
    return {
      name,
      type: type || 'String'
    };
  });
}
