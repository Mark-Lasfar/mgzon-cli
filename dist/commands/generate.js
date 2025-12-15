"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommand = generateCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
async function generateWebhook(name, baseDir) {
    const webhooksDir = path_1.default.join(baseDir, 'src', 'webhooks');
    await fs_extra_1.default.ensureDir(webhooksDir);
    const webhookContent = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  
  console.log('Webhook received:', payload);
  
  // Process webhook here
  
  return NextResponse.json({ received: true });
}
`;
    await fs_extra_1.default.writeFile(path_1.default.join(webhooksDir, `${name}.ts`), webhookContent);
    console.log(chalk_1.default.cyan(`  Webhook created: src/webhooks/${name}.ts`));
}
async function generateCommand(type, options) {
    const spinner = (0, ora_1.default)(`Generating ${type}...`).start();
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
                spinner.fail(chalk_1.default.red(`Unknown type: ${type}`));
                console.log(chalk_1.default.yellow('Available types: model, component, api, webhook'));
                return;
        }
        spinner.succeed(chalk_1.default.green(`${type} generated successfully!`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to generate ${type}`));
        console.error(chalk_1.default.red(error.message));
    }
}
async function generateModel(name, fields, baseDir) {
    const modelsDir = path_1.default.join(baseDir, 'src', 'models');
    await fs_extra_1.default.ensureDir(modelsDir);
    const fieldDefinitions = parseFields(fields);
    const modelContent = `import mongoose from 'mongoose';

const ${name}Schema = new mongoose.Schema({
  ${fieldDefinitions.map(f => `${f.name}: ${f.type}`).join(',\n  ')}
}, {
  timestamps: true
});

export default mongoose.models.${name} || mongoose.model('${name}', ${name}Schema);
`;
    await fs_extra_1.default.writeFile(path_1.default.join(modelsDir, `${name}.ts`), modelContent);
    console.log(chalk_1.default.cyan(`  Model created: src/models/${name}.ts`));
}
async function generateComponent(name, baseDir) {
    const componentsDir = path_1.default.join(baseDir, 'src', 'components');
    await fs_extra_1.default.ensureDir(componentsDir);
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
    await fs_extra_1.default.writeFile(path_1.default.join(componentsDir, `${name}.tsx`), componentContent);
    console.log(chalk_1.default.cyan(`  Component created: src/components/${name}.tsx`));
}
async function generateApi(name, baseDir) {
    const apiDir = path_1.default.join(baseDir, 'src', 'app', 'api', name);
    await fs_extra_1.default.ensureDir(apiDir);
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
    await fs_extra_1.default.writeFile(path_1.default.join(apiDir, 'route.ts'), routeContent);
    console.log(chalk_1.default.cyan(`  API created: src/app/api/${name}/route.ts`));
}
function parseFields(fieldsString) {
    if (!fieldsString)
        return [{ name: 'name', type: 'String' }];
    return fieldsString.split(',').map(field => {
        const [name, type] = field.split(':').map(s => s.trim());
        return {
            name,
            type: type || 'String'
        };
    });
}
//# sourceMappingURL=generate.js.map