// /workspaces/mgzon-cli/src/commands/generate.ts
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';

export async function generateCommand(type: string, options: any) {
  const spinner = ora(`Generating ${type}...`).start();

  try {
    const name = options.name || await promptForName(type);
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
      
      case 'page':
        await generatePage(name, baseDir);
        break;
      
      case 'layout':
        await generateLayout(name, baseDir);
        break;
      
      default:
        spinner.fail(chalk.red(`Unknown type: ${type}`));
        console.log(chalk.yellow('\nAvailable types:'));
        console.log(chalk.cyan('  model      - Database model'));
        console.log(chalk.cyan('  component  - React component'));
        console.log(chalk.cyan('  api        - API route handler'));
        console.log(chalk.cyan('  webhook    - Webhook handler'));
        console.log(chalk.cyan('  page       - Next.js page'));
        console.log(chalk.cyan('  layout     - Next.js layout\n'));
        return;
    }

    spinner.succeed(chalk.green(`✅ ${type} generated successfully!`));
    
    console.log(chalk.gray('   Debug: Generated in ' + baseDir));
    
    // Show next steps
    console.log(chalk.yellow('\n💡 Next Steps:'));
    
    switch (type.toLowerCase()) {
      case 'model':
        console.log(chalk.cyan('   1. Import the model in your API routes'));
        console.log(chalk.cyan('   2. Add validation and methods'));
        console.log(chalk.cyan('   3. Create database migrations\n'));
        break;
      
      case 'component':
        console.log(chalk.cyan('   1. Import the component in your pages'));
        console.log(chalk.cyan('   2. Add props and styling'));
        console.log(chalk.cyan('   3. Export from index.ts\n'));
        break;
      
      case 'api':
        console.log(chalk.cyan('   1. Test the API endpoint:'));
        console.log(chalk.cyan('      curl http://localhost:3000/api/' + name));
        console.log(chalk.cyan('   2. Add validation and business logic'));
        console.log(chalk.cyan('   3. Add authentication if needed\n'));
        break;
      
      case 'webhook':
        console.log(chalk.cyan('   1. Configure webhook URL in MGZON dashboard'));
        console.log(chalk.cyan('   2. Test with: mz webhook --simulate'));
        console.log(chalk.cyan('   3. Add error handling and logging\n'));
        break;
    }

  } catch (error: any) {
    spinner.fail(chalk.red(`❌ Failed to generate ${type}`));
    console.error(chalk.red(`  Error: ${error.message}`));
    
    if (error.code === 'EEXIST') {
      console.log(chalk.yellow('  File already exists. Use a different name.'));
    }
  }
}

async function promptForName(type: string): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: `Enter ${type} name:`,
      validate: (input: string) => {
        if (!input || input.trim().length < 2) {
          return `${type} name must be at least 2 characters`;
        }
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input)) {
          return `${type} name must start with a letter and contain only letters and numbers`;
        }
        return true;
      }
    }
  ]);
  
  return answers.name;
}

async function generateModel(name: string, fields: string, baseDir: string) {
  const modelsDir = path.join(baseDir, 'src', 'models');
  await fs.ensureDir(modelsDir);

  const fieldDefinitions = parseFields(fields);
  const modelName = name.charAt(0).toUpperCase() + name.slice(1);
  
  const modelContent = `import mongoose from 'mongoose';

export interface I${modelName} extends mongoose.Document {
  ${fieldDefinitions.map(f => `${f.name}: ${getTypeScriptType(f.type)}`).join(';\n  ')}
  createdAt: Date;
  updatedAt: Date;
}

const ${name}Schema = new mongoose.Schema({
  ${fieldDefinitions.map(f => `  ${f.name}: { type: ${f.type}, ${getFieldOptions(f)} }`).join(',\n  ')}
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

${name}Schema.index({ createdAt: -1 });
${name}Schema.index({ updatedAt: -1 });

// Add methods and statics here if needed
// ${name}Schema.methods.someMethod = function() {};

export default mongoose.models.${modelName} || mongoose.model<I${modelName}>('${modelName}', ${name}Schema);
`;

  const modelFile = path.join(modelsDir, `${name}.model.ts`);
  await fs.writeFile(modelFile, modelContent);
  
  console.log(chalk.cyan(`  Model created: src/models/${name}.model.ts`));
  
  // Create index file
  const indexFile = path.join(modelsDir, 'index.ts');
  const indexContent = `// Export all models
export { default as ${modelName} } from './${name}.model';
`;
  
  if (!await fs.pathExists(indexFile)) {
    await fs.writeFile(indexFile, indexContent);
  } else {
    // Append to existing index
    const currentContent = await fs.readFile(indexFile, 'utf8');
    if (!currentContent.includes(`export { default as ${modelName}`)) {
      await fs.appendFile(indexFile, `\nexport { default as ${modelName} } from './${name}.model';`);
    }
  }
}

async function generateComponent(name: string, baseDir: string) {
  const componentsDir = path.join(baseDir, 'src', 'components');
  await fs.ensureDir(componentsDir);
  
  const componentName = name.charAt(0).toUpperCase() + name.slice(1);

  const componentContent = `'use client';

import { cn } from '@/lib/utils';

export interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

export default function ${componentName}({ 
  className,
  children 
}: ${componentName}Props) {
  return (
    <div className={cn('p-4 border rounded-lg', className)}>
      <h2 className="text-xl font-semibold mb-2">${componentName}</h2>
      <div className="text-gray-600">
        {children || 'This is the ${componentName} component'}
      </div>
    </div>
  );
}
`;

  const componentFile = path.join(componentsDir, `${componentName}.tsx`);
  await fs.writeFile(componentFile, componentContent);
  
  console.log(chalk.cyan(`  Component created: src/components/${componentName}.tsx`));
  
  // Create index file
  const indexFile = path.join(componentsDir, 'index.ts');
  const indexContent = `// Export all components
export { default as ${componentName} } from './${componentName}';
`;
  
  if (!await fs.pathExists(indexFile)) {
    await fs.writeFile(indexFile, indexContent);
  } else {
    // Append to existing index
    const currentContent = await fs.readFile(indexFile, 'utf8');
    if (!currentContent.includes(`export { default as ${componentName}`)) {
      await fs.appendFile(indexFile, `\nexport { default as ${componentName} } from './${componentName}';`);
    }
  }
}

async function generateApi(name: string, baseDir: string) {
  const apiDir = path.join(baseDir, 'src', 'app', 'api', name);
  await fs.ensureDir(apiDir);

  const routeContent = `import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth } from '@/lib/api/middleware/auth';

// GET /api/${name}
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        message: '${name} API endpoint',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/${name}
export const POST = withApiKeyAuth(async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    return NextResponse.json({
      success: true,
      data: {
        message: '${name} created successfully',
        data: body,
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});

// PUT /api/${name}
export const PUT = withApiKeyAuth(async function PUT(req: NextRequest) {
  return NextResponse.json({
    success: true,
    data: { message: '${name} updated' }
  });
});

// DELETE /api/${name}
export const DELETE = withApiKeyAuth(async function DELETE(req: NextRequest) {
  return NextResponse.json({
    success: true,
    data: { message: '${name} deleted' }
  });
});
`;

  const routeFile = path.join(apiDir, 'route.ts');
  await fs.writeFile(routeFile, routeContent);
  
  console.log(chalk.cyan(`  API route created: src/app/api/${name}/route.ts`));
  console.log(chalk.gray(`   URL: http://localhost:3000/api/${name}`));
}

async function generateWebhook(name: string, baseDir: string) {
  const webhooksDir = path.join(baseDir, 'src', 'app', 'api', 'webhooks');
  await fs.ensureDir(webhooksDir);

  const webhookContent = `import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature');
    const payload = await req.text();
    
    if (!WEBHOOK_SECRET) {
      return NextResponse.json({
        error: 'Webhook secret not configured'
      }, { status: 500 });
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return NextResponse.json({
        error: 'Invalid signature'
      }, { status: 401 });
    }
    
    const data = JSON.parse(payload);
    console.log('Webhook received:', data);
    
    // Process webhook based on event type
    switch (data.event) {
      case '${name}.created':
        // Handle creation
        break;
      
      case '${name}.updated':
        // Handle update
        break;
      
      case '${name}.deleted':
        // Handle deletion
        break;
      
      default:
        console.log('Unknown event type:', data.event);
    }
    
    return NextResponse.json({ 
      success: true,
      received: true 
    });
    
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
`;

  const webhookFile = path.join(webhooksDir, `${name}.ts`);
  await fs.writeFile(webhookFile, webhookContent);
  
  console.log(chalk.cyan(`  Webhook handler created: src/app/api/webhooks/${name}.ts`));
  console.log(chalk.gray(`   URL: http://localhost:3000/api/webhooks/${name}`));
  console.log(chalk.yellow('   ⚠️  Remember to set WEBHOOK_SECRET environment variable'));
}

async function generatePage(name: string, baseDir: string) {
  const pagesDir = path.join(baseDir, 'src', 'app');
  await fs.ensureDir(pagesDir);

  const pageContent = `export default function ${name.charAt(0).toUpperCase() + name.slice(1)}Page() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">${name}</h1>
      <p className="text-gray-600">
        This is the ${name} page.
      </p>
    </div>
  );
}
`;

  const pageFile = path.join(pagesDir, `${name}`, 'page.tsx');
  await fs.ensureDir(path.dirname(pageFile));
  await fs.writeFile(pageFile, pageContent);
  
  console.log(chalk.cyan(`  Page created: src/app/${name}/page.tsx`));
  console.log(chalk.gray(`   URL: http://localhost:3000/${name}`));
}

async function generateLayout(name: string, baseDir: string) {
  const layoutsDir = path.join(baseDir, 'src', 'app');
  await fs.ensureDir(layoutsDir);

  const layoutContent = `import { ReactNode } from 'react';

export default function ${name.charAt(0).toUpperCase() + name.slice(1)}Layout({
  children
}: {
  children: ReactNode
}) {
  return (
    <div className="${name}-layout">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">${name}</h1>
      </header>
      <main className="p-4">
        {children}
      </main>
      <footer className="bg-gray-100 p-4 text-center">
        <p className="text-gray-600">&copy; ${new Date().getFullYear()} MGZON App</p>
      </footer>
    </div>
  );
}
`;

  const layoutFile = path.join(layoutsDir, `${name}`, 'layout.tsx');
  await fs.ensureDir(path.dirname(layoutFile));
  await fs.writeFile(layoutFile, layoutContent);
  
  console.log(chalk.cyan(`  Layout created: src/app/${name}/layout.tsx`));
}

function parseFields(fieldsString: string): Array<{name: string, type: string}> {
  if (!fieldsString) return [
    { name: 'name', type: 'String' },
    { name: 'description', type: 'String' }
  ];
  
  return fieldsString.split(',').map(field => {
    const [name, type] = field.split(':').map(s => s.trim());
    return {
      name,
      type: type || 'String'
    };
  });
}

function getTypeScriptType(mongooseType: string): string {
  const typeMap: Record<string, string> = {
    'String': 'string',
    'Number': 'number',
    'Boolean': 'boolean',
    'Date': 'Date',
    'Buffer': 'Buffer',
    'ObjectId': 'mongoose.Types.ObjectId',
    'Mixed': 'any',
    'Array': 'any[]',
    'Decimal128': 'number',
    'Map': 'Map<string, any>'
  };
  
  return typeMap[mongooseType] || 'any';
}

function getFieldOptions(field: {name: string, type: string}): string {
  const options: string[] = [];
  
  // Add required for important fields
  if (field.name === 'name' || field.name === 'email') {
    options.push('required: true');
  }
  
  // Add unique for certain fields
  if (field.name === 'email' || field.name === 'username') {
    options.push('unique: true');
  }
  
  // Add trim for strings
  if (field.type === 'String') {
    options.push('trim: true');
  }
  
  // Default value for booleans
  if (field.type === 'Boolean') {
    options.push('default: false');
  }
  
  return options.join(', ');
}