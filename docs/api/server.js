// docs/api/server.js - Simple Express server
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// API endpoint to get CLI version
app.get('/api/cli/version', (req, res) => {
    try {
        const packageJson = require('../package.json');
        res.json({
            version: packageJson.version,
            name: packageJson.name,
            description: packageJson.description
        });
    } catch (error) {
        res.json({
            version: '2.0.8',
            name: '@mg-cli/cli',
            description: 'MGZON Command Line Interface'
        });
    }
});

// API endpoint to get CLI help
app.get('/api/cli/help', async (req, res) => {
    try {
        // Read actual help from CLI source
        const helpText = await getCliHelpText();
        res.send(helpText);
    } catch (error) {
        res.send('MGZON CLI - Type "mz --help" for command list');
    }
});

// API endpoint to get documentation
app.get('/api/docs/:name', async (req, res) => {
    const { name } = req.params;
    
    try {
        const filePath = path.join(__dirname, '..', `${name}.mdx`);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Convert MDX to HTML (simplified)
        const html = convertMDXtoHTML(content);
        
        res.json({
            success: true,
            title: getTitleFromMDX(content),
            content: html,
            raw: content
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Document not found'
        });
    }
});

// API endpoint to list all docs
app.get('/api/docs', async (req, res) => {
    try {
        const files = await fs.readdir(path.join(__dirname, '..'));
        const docs = files
            .filter(file => file.endsWith('.mdx'))
            .map(file => ({
                name: file.replace('.mdx', ''),
                title: getTitleFromFile(file)
            }));
        
        res.json({ docs });
    } catch (error) {
        res.json({ docs: [] });
    }
});

// Helper functions
function convertMDXtoHTML(mdx) {
    // Simple conversion for demo
    return mdx
        .replace(/^# (.*)/gm, '<h1>$1</h1>')
        .replace(/^## (.*)/gm, '<h2>$1</h2>')
        .replace(/^### (.*)/gm, '<h3>$1</h3>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function getTitleFromMDX(content) {
    const match = content.match(/^# (.*)/m);
    return match ? match[1] : 'Documentation';
}

function getTitleFromFile(filename) {
    return filename
        .replace('.mdx', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

async function getCliHelpText() {
    try {
        // Read from actual CLI help
        const { execSync } = require('child_process');
        const cliPath = path.join(__dirname, '..', '..', 'dist', 'index.js');
        
        if (fs.existsSync(cliPath)) {
            const help = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });
            return help;
        }
    } catch (error) {
        console.error('Failed to get CLI help:', error);
    }
    
    // Fallback
    return `
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
`;
}

// Start server
app.listen(port, () => {
    console.log(`📚 Docs API server running at http://localhost:${port}`);
    console.log(`🌐 Open http://localhost:${port} in your browser`);
});