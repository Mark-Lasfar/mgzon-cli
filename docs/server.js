// Simple Express Server for Docs API
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API: Get CLI version
app.get('/api/cli/version', (req, res) => {
    try {
        const packagePath = path.join(__dirname, '..', 'package.json');
        const packageJson = require(packagePath);
        
        res.json({
            success: true,
            version: packageJson.version,
            name: packageJson.name,
            description: packageJson.description,
            homepage: packageJson.homepage
        });
    } catch (error) {
        res.json({
            success: true,
            version: '2.0.8',
            name: '@mg-cli/cli',
            description: 'MGZON Command Line Interface',
            homepage: 'https://github.com/Mark-Lasfar/mgzon-cli'
        });
    }
});

// API: Get CLI help
app.get('/api/cli/help', async (req, res) => {
    try {
        // Try to read from actual CLI
        const cliIndex = path.join(__dirname, '..', 'src', 'index.ts');
        const content = await fs.readFile(cliIndex, 'utf-8');
        
        // Extract help text (simplified)
        const helpText = extractHelpText(content);
        res.send(helpText);
    } catch (error) {
        // Fallback help
        const help = `
MGZON CLI v2.0.8

Usage: mz [options] [command]

Options:
  -v, --version           output the version number
  -h, --help              display help for command

Commands:
  login                   Login to MGZON
  logout                  Logout from MGZON
  whoami                  Show current user
  init [project-name]     Initialize new project
  serve                   Start development server
  build                   Build for production
  deploy                  Deploy to MGZON
  apps                    Manage applications
  keys                    Manage API keys
  config                  Manage configuration
  webhook                 Manage webhooks
  db                      Database operations
  storage                 File storage operations
  docs                    Open documentation
  support                 Show support options
  update                  Update CLI
  help [command]          display help for command

For more info: mz <command> --help
        `;
        res.send(help.trim());
    }
});

// API: List documentation files
app.get('/api/docs', async (req, res) => {
    try {
        const files = await fs.readdir(__dirname);
        const docs = files
            .filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
            .map(file => ({
                name: file.replace(/\.(mdx|md)$/, ''),
                title: formatTitle(file),
                path: file
            }));
        
        res.json({ success: true, docs });
    } catch (error) {
        res.json({ 
            success: false, 
            error: 'Failed to list docs',
            docs: []
        });
    }
});

// API: Get specific documentation
app.get('/api/docs/:name', async (req, res) => {
    const { name } = req.params;
    
    try {
        // Try .mdx first, then .md
        let filePath;
        if (await fileExists(path.join(__dirname, `${name}.mdx`))) {
            filePath = path.join(__dirname, `${name}.mdx`);
        } else if (await fileExists(path.join(__dirname, `${name}.md`))) {
            filePath = path.join(__dirname, `${name}.md`);
        } else {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }
        
        const content = await fs.readFile(filePath, 'utf-8');
        const title = extractTitle(content);
        
        res.json({
            success: true,
            title,
            content,
            html: convertMarkdownToHTML(content)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to read document'
        });
    }
});

// Helper functions
async function fileExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

function extractHelpText(content) {
    // Simple extraction of help text from CLI source
    const lines = content.split('\n');
    let inHelp = false;
    let helpLines = [];
    
    for (const line of lines) {
        if (line.includes('addHelpText') || line.includes('program.help')) {
            inHelp = true;
        }
        
        if (inHelp && (line.includes('`') || line.includes("'"))) {
            helpLines.push(line.trim());
        }
        
        if (inHelp && line.includes(');')) {
            break;
        }
    }
    
    return helpLines.join('\n').replace(/`/g, '').replace(/\\n/g, '\n');
}

function formatTitle(filename) {
    return filename
        .replace(/\.(mdx|md)$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

function extractTitle(content) {
    const match = content.match(/^# (.*)$/m);
    return match ? match[1] : 'Documentation';
}

function convertMarkdownToHTML(markdown) {
    // Simple markdown to HTML conversion
    return markdown
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/`(.*?)`/gim, '<code>$1</code>')
        .replace(/```([a-z]*)\n([\s\S]*?)\n```/gim, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

// Start server
app.listen(PORT, () => {
    console.log(`
🚀 MGZON CLI Documentation Server
─────────────────────────────────
✅ Server running on port ${PORT}
📂 Serving from: ${__dirname}
🌐 Open: http://localhost:${PORT}
📄 API: http://localhost:${PORT}/api/cli/version
📚 Docs: http://localhost:${PORT}/api/docs

Press Ctrl+C to stop
    `);
});