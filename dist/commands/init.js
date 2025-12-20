"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../utils/config");
async function initCommand(projectName, options) {
    const spinner = (0, ora_1.default)('Creating MGZON app...').start();
    try {
        const apiUrl = await (0, config_1.getApiUrl)();
        console.log(chalk_1.default.gray(`   Debug: API URL: ${apiUrl}`));
        const projectDir = path_1.default.join(process.cwd(), projectName || 'mgzon-app');
        if (await fs_extra_1.default.pathExists(projectDir) && (await fs_extra_1.default.readdir(projectDir)).length > 0) {
            spinner.stop();
            console.log(chalk_1.default.red('\n' + '─'.repeat(50)));
            console.log(chalk_1.default.red('❌ Directory not empty!'));
            console.log(chalk_1.default.red('─'.repeat(50)));
            console.log(chalk_1.default.cyan(`   Directory: ${projectDir}`));
            console.log(chalk_1.default.cyan('   Choose a different name or empty the directory\n'));
            return;
        }
        await fs_extra_1.default.ensureDir(projectDir);
        const template = options.template || 'nextjs';
        const templatePath = path_1.default.join(__dirname, '../../templates', template);
        console.log(chalk_1.default.gray(`   Debug: Looking for template: ${templatePath}`));
        if (await fs_extra_1.default.pathExists(templatePath)) {
            console.log(chalk_1.default.gray(`   Debug: Found template, copying...`));
            await fs_extra_1.default.copy(templatePath, projectDir);
        }
        else {
            console.log(chalk_1.default.gray(`   Debug: Template not found, creating basic structure...`));
            await createBasicStructure(projectDir, options, apiUrl);
        }
        await createProjectConfig(projectDir, apiUrl);
        spinner.succeed(chalk_1.default.green('✅ MGZON app created successfully!'));
        console.log(chalk_1.default.cyan('\n' + '═'.repeat(50)));
        console.log(chalk_1.default.bold('🚀 Next Steps:'));
        console.log(chalk_1.default.cyan('═'.repeat(50)));
        console.log(chalk_1.default.cyan(`   cd ${projectName || 'mgzon-app'}`));
        console.log(chalk_1.default.cyan('   npm install'));
        console.log(chalk_1.default.cyan('   mz serve\n'));
        console.log(chalk_1.default.yellow('🔧 Configuration:'));
        console.log(chalk_1.default.gray(`   API URL: ${apiUrl}`));
        console.log(chalk_1.default.gray(`   Config file: ${path_1.default.join(projectDir, '.mgzon.json')}`));
        console.log(chalk_1.default.cyan('\n📚 Documentation:'));
        console.log(chalk_1.default.blue('   https://developers.mgzon.com/docs\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Failed to create app'));
        console.error(chalk_1.default.red(`   Error: ${error.message}`));
        if (error.code === 'ENOENT') {
            console.log(chalk_1.default.yellow('\n💡 Tip:'));
            console.log(chalk_1.default.cyan('   Make sure you have write permissions to the directory'));
        }
    }
}
async function createBasicStructure(projectDir, options, apiUrl) {
    const useTypeScript = options.typescript !== false;
    const packageName = path_1.default.basename(projectDir);
    const structure = {
        'package.json': JSON.stringify({
            name: packageName,
            version: '1.0.0',
            private: true,
            scripts: {
                dev: 'next dev',
                build: 'next build',
                start: 'next start',
                lint: 'next lint',
                deploy: 'mz deploy',
                'mgzon:serve': 'mz serve',
                'mgzon:deploy': 'mz deploy --env=staging'
            },
            dependencies: {
                '@mgzon/sdk': '^1.0.0',
                react: '^18.2.0',
                'react-dom': '^18.2.0',
                next: '^14.0.0',
                '@types/node': useTypeScript ? '^20.0.0' : undefined,
                '@types/react': useTypeScript ? '^18.2.0' : undefined,
                '@types/react-dom': useTypeScript ? '^18.2.0' : undefined,
                'typescript': useTypeScript ? '^5.0.0' : undefined,
                'tailwindcss': '^3.3.0',
                'autoprefixer': '^10.4.0',
                'postcss': '^8.4.0'
            },
            devDependencies: {
                'eslint': '^8.0.0',
                'eslint-config-next': '^14.0.0'
            }
        }, null, 2),
        'mgzon.config.json': JSON.stringify({
            name: packageName,
            version: '1.0.0',
            description: 'MGZON App - Created with MGZON CLI',
            apiUrl: apiUrl,
            permissions: ['products:read', 'products:write', 'orders:read', 'orders:write'],
            webhooks: options.withWebhooks ? ['order.created', 'product.updated'] : [],
            features: options.withAuth ? ['authentication'] : [],
            database: options.withDatabase ? {
                type: 'mongodb',
                enabled: true
            } : {
                type: 'none',
                enabled: false
            }
        }, null, 2),
        'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    MGZON_API_URL: process.env.MGZON_API_URL || '${apiUrl}'
  }
};

module.exports = nextConfig;`,
        'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mgzon: {
          primary: '#2563eb',
          secondary: '#7c3aed',
          accent: '#f59e0b'
        }
      }
    },
  },
  plugins: [],
};`,
        'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
        '.env.local': `# MGZON Configuration
MGZON_API_URL=${apiUrl}
MGZON_API_KEY=your_api_key_here

# Next.js Configuration
NEXT_PUBLIC_APP_NAME=${packageName}
NEXT_PUBLIC_APP_URL=http://localhost:3000
`,
        'tsconfig.json': useTypeScript ? JSON.stringify({
            compilerOptions: {
                target: "es5",
                lib: ["dom", "dom.iterable", "esnext"],
                allowJs: true,
                skipLibCheck: true,
                strict: true,
                forceConsistentCasingInFileNames: true,
                noEmit: true,
                esModuleInterop: true,
                module: "esnext",
                moduleResolution: "node",
                resolveJsonModule: true,
                isolatedModules: true,
                jsx: "preserve",
                incremental: true,
                baseUrl: ".",
                paths: {
                    "@/*": ["./src/*"]
                }
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
            exclude: ["node_modules"]
        }, null, 2) : undefined,
        'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}`,
        'src/app/layout.tsx': `import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '${packageName} - MGZON App',
  description: 'A MGZON application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}`,
        'src/app/page.tsx': `import { MgzonLogo } from '@/components/MgzonLogo';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <MgzonLogo className="h-16 w-auto mx-auto" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-mgzon-primary">${packageName}</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Your MGZON application is ready!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">🚀 Quick Start</h3>
            <p className="text-gray-600">
              Run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code> to start development
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">🔧 Development</h3>
            <p className="text-gray-600">
              Use <code className="bg-gray-100 px-2 py-1 rounded">mz serve</code> for local development
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">📦 Deployment</h3>
            <p className="text-gray-600">
              Deploy with <code className="bg-gray-100 px-2 py-1 rounded">mz deploy</code>
            </p>
          </div>
        </div>
        
        <div className="bg-mgzon-primary/10 p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Next Steps:</h3>
          <div className="text-left inline-block">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-mgzon-primary text-white flex items-center justify-center mr-3">1</div>
              <span>Configure your API keys in <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-mgzon-primary text-white flex items-center justify-center mr-3">2</div>
              <span>Customize your app in <code className="bg-gray-100 px-2 py-1 rounded">mgzon.config.json</code></span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-mgzon-primary text-white flex items-center justify-center mr-3">3</div>
              <span>Deploy your app with <code className="bg-gray-100 px-2 py-1 rounded">mz deploy</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
        'src/components/MgzonLogo.tsx': `import { SVGProps } from 'react';

interface MgzonLogoProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export function MgzonLogo({ className, ...props }: MgzonLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="120" height="120" rx="20" fill="#2563EB" />
      <path
        d="M30 40L60 70L90 40"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="45" cy="55" r="6" fill="white" />
      <circle cx="75" cy="55" r="6" fill="white" />
      <path
        d="M35 85H85"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}`,
        'src/lib/utils.ts': `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
        'src/app/api/hello/route.ts': `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Hello from MGZON API!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}`,
        'README.md': `# ${packageName}

A MGZON application built with Next.js

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- MGZON CLI (\`npm install -g @mgzon/cli\`)

### Installation
\`\`\`bash
npm install
\`\`\`

### Development
\`\`\`bash
# Start development server
npm run dev
# or
mz serve

# Build for production
npm run build

# Start production server
npm start
\`\`\`

### Deployment
\`\`\`bash
# Deploy to MGZON
mz deploy

# Deploy to specific environment
mz deploy --env=production
\`\`\`

## 🔧 Configuration

1. Set your API key in \`.env.local\`:
   \`\`\`
   MGZON_API_KEY=your_api_key_here
   \`\`\`

2. Configure app settings in \`mgzon.config.json\`

## 📁 Project Structure

\`\`\`
.
├── src/
│   ├── app/           # Next.js app router
│   ├── components/    # React components
│   └── lib/          # Utilities
├── public/           # Static files
├── mgzon.config.json # MGZON configuration
└── package.json      # Dependencies
\`\`\`

## 📚 Documentation

- [MGZON Documentation](https://docs.mgzon.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🔗 Links

- Website: https://mgzon.com
- Dashboard: https://app.mgzon.com
- CLI Documentation: https://docs.mgzon.com/cli

---

Built with ❤️ by [MGZON](https://mgzon.com)`
    };
    for (const [filePath, content] of Object.entries(structure)) {
        if (content !== undefined) {
            const fullPath = path_1.default.join(projectDir, filePath);
            await fs_extra_1.default.ensureDir(path_1.default.dirname(fullPath));
            await fs_extra_1.default.writeFile(fullPath, content);
            console.log(chalk_1.default.gray(`   Created: ${filePath}`));
        }
    }
}
async function createProjectConfig(projectDir, apiUrl) {
    const config = {
        apiUrl,
        projectType: 'mgzon-app',
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        cliVersion: require('../../package.json').version
    };
    await fs_extra_1.default.writeJson(path_1.default.join(projectDir, '.mgzon.json'), config, { spaces: 2 });
    console.log(chalk_1.default.gray(`   Created: .mgzon.json`));
}
//# sourceMappingURL=init.js.map