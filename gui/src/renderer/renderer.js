// MGZON GUI Renderer Process

const { electronAPI } = window;

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');
const terminalOutput = document.getElementById('terminalOutput');
const clearTerminalBtn = document.getElementById('clearTerminalBtn');

// Navigation
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const sectionId = btn.dataset.section;

    // Update active nav button
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Show active section
    sections.forEach(section => {
      section.classList.toggle('active', section.id === sectionId);
    });
  });
});

// Terminal functions
function addToTerminal(text, type = 'output') {
  const line = document.createElement('div');
  line.className = type;
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function clearTerminal() {
  terminalOutput.innerHTML = '';
}

clearTerminalBtn.addEventListener('click', clearTerminal);

// CLI Command wrapper
async function runCommand(command, args = [], showInTerminal = true) {
  try {
    if (showInTerminal) {
      addToTerminal(`$ mz ${command} ${args.join(' ')}`, 'command');
    }

    const result = await electronAPI.runCliCommand(command, args);

    if (showInTerminal) {
      if (result.stdout) {
        addToTerminal(result.stdout, 'output');
      }
      if (result.stderr) {
        addToTerminal(result.stderr, 'error');
      }
    }

    return result;
  } catch (error) {
    if (showInTerminal) {
      addToTerminal(`Error: ${error.message}`, 'error');
    }
    throw error;
  }
}

// Initialize app
async function initApp() {
  try {
    // Check CLI version
    const versionResult = await runCommand('--version', [], false);
    document.getElementById('cliVersion').textContent =
      versionResult.stdout.trim() || 'Unknown';

    // Check authentication status
    await checkAuthStatus();

    addToTerminal('MGZON GUI initialized successfully', 'output');
  } catch (error) {
    addToTerminal(`Failed to initialize: ${error.message}`, 'error');
  }
}

// Authentication
async function checkAuthStatus() {
  try {
    const result = await runCommand('whoami', [], false);
    const userInfo = document.getElementById('userInfo');
    const userStatus = document.getElementById('userStatus');
    const loginBtn = document.getElementById('loginBtn');

    if (result.code === 0) {
      userStatus.textContent = `Logged in as: ${result.stdout.trim()}`;
      loginBtn.textContent = 'Switch Account';
    } else {
      userStatus.textContent = 'Not logged in';
      loginBtn.textContent = 'Login';
    }
  } catch (error) {
    document.getElementById('userStatus').textContent = 'Not logged in';
  }
}

// Event Listeners
document.getElementById('loginBtn').addEventListener('click', async () => {
  try {
    await runCommand('login');
    await checkAuthStatus();
  } catch (error) {
    addToTerminal(`Login failed: ${error.message}`, 'error');
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await runCommand('logout');
    await checkAuthStatus();
    addToTerminal('Logged out successfully', 'output');
  } catch (error) {
    addToTerminal(`Logout failed: ${error.message}`, 'error');
  }
});

// Project Management
document.getElementById('newProjectBtn').addEventListener('click', () => {
  document.querySelector('[data-section="projects"]').click();
  document.getElementById('projectForm').style.display = 'block';
});

document.getElementById('initProjectBtn').addEventListener('click', () => {
  document.getElementById('projectForm').style.display = 'block';
});

document.getElementById('openProjectBtn').addEventListener('click', async () => {
  try {
    const directory = await electronAPI.selectDirectory();
    if (directory) {
      addToTerminal(`Opening project: ${directory}`, 'output');
      // Here you could add logic to open the project
    }
  } catch (error) {
    addToTerminal(`Failed to open directory: ${error.message}`, 'error');
  }
});

document.getElementById('browsePathBtn').addEventListener('click', async () => {
  try {
    const directory = await electronAPI.selectDirectory();
    if (directory) {
      document.getElementById('projectPath').value = directory;
    }
  } catch (error) {
    addToTerminal(`Failed to select directory: ${error.message}`, 'error');
  }
});

document.getElementById('newProjectForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const projectName = document.getElementById('projectName').value;
  const template = document.getElementById('template').value;
  const projectPath = document.getElementById('projectPath').value;

  if (!projectPath) {
    addToTerminal('Please select a project location', 'error');
    return;
  }

  try {
    const args = [projectName, `--template=${template}`];
    if (projectPath !== process.cwd()) {
      // Note: This is a simplified example. In reality, you'd need to handle directory changes
      addToTerminal(`Please navigate to ${projectPath} in terminal first`, 'output');
    }

    await runCommand('init', args);
    addToTerminal(`Project "${projectName}" created successfully!`, 'output');

    // Reset form
    e.target.reset();
    document.getElementById('projectForm').style.display = 'none';
  } catch (error) {
    addToTerminal(`Failed to create project: ${error.message}`, 'error');
  }
});

// Quick Actions
document.getElementById('serveBtn').addEventListener('click', async () => {
  try {
    addToTerminal('Starting development server...', 'output');
    const result = await runCommand('serve');
    if (result.code === 0) {
      addToTerminal('Development server started successfully!', 'output');
    }
  } catch (error) {
    addToTerminal(`Failed to start server: ${error.message}`, 'error');
  }
});

document.getElementById('deployBtn').addEventListener('click', async () => {
  try {
    addToTerminal('Deploying application...', 'output');
    const result = await runCommand('deploy');
    if (result.code === 0) {
      addToTerminal('Deployment completed successfully!', 'output');
    }
  } catch (error) {
    addToTerminal(`Deployment failed: ${error.message}`, 'error');
  }
});

// Apps Management
document.getElementById('refreshAppsBtn').addEventListener('click', async () => {
  try {
    const result = await runCommand('apps:list', [], false);
    document.getElementById('appsList').innerHTML = `<pre>${result.stdout}</pre>`;
  } catch (error) {
    document.getElementById('appsList').innerHTML = `<p class="error">Failed to load apps: ${error.message}</p>`;
  }
});

document.getElementById('createAppBtn').addEventListener('click', async () => {
  const appName = prompt('Enter app name:');
  if (appName) {
    try {
      await runCommand('apps:create', [appName]);
      addToTerminal(`App "${appName}" created successfully!`, 'output');
      document.getElementById('refreshAppsBtn').click();
    } catch (error) {
      addToTerminal(`Failed to create app: ${error.message}`, 'error');
    }
  }
});

// Storage Management
document.getElementById('uploadFileBtn').addEventListener('click', async () => {
  try {
    const filePath = await electronAPI.selectFile();
    if (filePath) {
      await runCommand('storage:upload', [filePath]);
      addToTerminal(`File uploaded successfully!`, 'output');
      document.getElementById('refreshStorageBtn').click();
    }
  } catch (error) {
    addToTerminal(`Failed to upload file: ${error.message}`, 'error');
  }
});

document.getElementById('refreshStorageBtn').addEventListener('click', async () => {
  try {
    const result = await runCommand('storage:list', [], false);
    document.getElementById('storageList').innerHTML = `<pre>${result.stdout}</pre>`;
  } catch (error) {
    document.getElementById('storageList').innerHTML = `<p class="error">Failed to load storage: ${error.message}</p>`;
  }
});

// Settings
document.getElementById('viewConfigBtn').addEventListener('click', async () => {
  try {
    const result = await runCommand('config:list', [], false);
    document.getElementById('authStatus').innerHTML = `<pre>${result.stdout}</pre>`;
  } catch (error) {
    document.getElementById('authStatus').innerHTML = `<p class="error">Failed to load config: ${error.message}</p>`;
  }
});

document.getElementById('loginSettingsBtn').addEventListener('click', () => {
  document.getElementById('loginBtn').click();
});

document.getElementById('checkUpdatesBtn').addEventListener('click', async () => {
  try {
    await runCommand('update');
    addToTerminal('Update check completed', 'output');
  } catch (error) {
    addToTerminal(`Update check failed: ${error.message}`, 'error');
  }
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);