class DocRouter {
    constructor() {
        this.routes = {
            '/': 'home',
            '/docs': 'docs',
            '/docs/installation': 'installation',
            '/docs/architecture': 'architecture',
            '/docs/user-flow': 'user-flow',
            '/docs/end-to-end': 'end-to-end',
            '/docs/gui-backend': 'gui-backend'
        };
        this.init();
    }
    
    init() {
        // Handle hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }
    
    async handleRoute() {
        const hash = window.location.hash.substring(1);
        const page = hash || 'home';
        
        // Load appropriate content
        await this.loadContent(page);
    }
    
    async loadContent(page) {
        const contentDiv = document.getElementById('main-content');
        if (!contentDiv) return;
        
        try {
            // Try to load .mdx file
            const response = await fetch(`/${page}.mdx`);
            if (response.ok) {
                const text = await response.text();
                contentDiv.innerHTML = this.convertMDXtoHTML(text);
            } else {
                // Fallback to static content
                contentDiv.innerHTML = await this.getStaticContent(page);
            }
        } catch (error) {
            contentDiv.innerHTML = this.getErrorContent(page, error);
        }
    }
    
    convertMDXtoHTML(mdx) {
        // Simple MDX to HTML converter
        let html = mdx
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
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        return `<div class="mdx-content">${html}</div>`;
    }
    
    async getStaticContent(page) {
        const content = {
            home: '<h1>MGZON CLI</h1><p>Welcome to MGZON CLI Documentation</p>',
            docs: '<h1>Documentation</h1><p>Select a documentation page from the sidebar</p>',
            installation: '<h1>Installation Guide</h1><p>Loading installation guide...</p>',
            architecture: '<h1>Architecture Diagram</h1><p>Loading architecture...</p>',
            'user-flow': '<h1>User Flow</h1><p>Loading user flow...</p>',
            'end-to-end': '<h1>End-to-End Flow</h1><p>Loading end-to-end flow...</p>',
            'gui-backend': '<h1>GUI Backend Interaction</h1><p>Loading GUI interaction...</p>'
        };
        
        return content[page] || '<h1>Page Not Found</h1><p>The requested page does not exist.</p>';
    }
    
    getErrorContent(page, error) {
        return `
        <div class="error-content">
            <h1>Error Loading ${page}</h1>
            <p>Failed to load content: ${error.message}</p>
            <p>Please check if the documentation file exists.</p>
            <a href="/" class="btn">Return Home</a>
        </div>
        `;
    }
}

// Initialize router when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.docRouter = new DocRouter();
});
