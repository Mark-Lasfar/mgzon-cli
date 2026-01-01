---
name: Bug Report
about: Report a bug or unexpected behavior in MGZON CLI
title: '[BUG] '
labels: ['bug', 'triage']
assignees: ''

---

## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔍 Steps to Reproduce
1. Run command: `mz ...`
2. Observe error: `...`
3. ...

## ✅ Expected Behavior
What you expected to happen.

## ❌ Actual Behavior
What actually happened. Include error messages or screenshots.

## 🖥️ Environment
- **OS**: [e.g. Ubuntu 22.04, macOS Sonoma 14.2, Windows 11]
- **Node Version**: [e.g. 20.10.0 - run `node --version`]
- **CLI Version**: [e.g. 2.0.8 - run `mz --version`]
- **Installation Method**: [npm, binary, Docker, GUI]
- **Shell**: [e.g. bash 5.2, zsh 5.9, PowerShell 7.4]

## 📋 Additional Context
- Have you recently updated the CLI?
- Does this happen with all commands or specific ones?
- Are you using environment variables or config file?

## 📝 Logs
```
Paste relevant logs here. Enable debug mode with: DEBUG=mgzon:* mz <command>
```

## 📸 Screenshots
If applicable, add screenshots to help explain your problem.

## 🔧 Troubleshooting Attempted
- [ ] Cleared cache: `rm -rf ~/.mgzon`
- [ ] Reinstalled CLI
- [ ] Tried different installation method
- [ ] Checked network connectivity

---

*Thank you for helping improve MGZON CLI!*
```

### `.github/ISSUE_TEMPLATE/feature_request.md`:
```markdown
---
name: Feature Request
about: Suggest an idea for MGZON CLI
title: '[FEATURE] '
labels: ['enhancement', 'triage']
assignees: ''

---

## 🎯 Problem Statement
What problem are you trying to solve? Why is this problem important?

## 💡 Proposed Solution
Describe the solution you'd like. Be specific about:
- New commands or options
- API changes
- Configuration additions
- User interface improvements

## 🔄 Alternative Solutions
Describe alternatives you've considered. Why is your proposed solution better?

## 👥 Use Cases
Who would benefit from this feature and how?
- Developer workflows
- CI/CD integration
- Team collaboration
- Performance improvements

## 📊 Impact
- Estimated development effort: [Small/Medium/Large]
- Breaking changes: [Yes/No]
- Backward compatibility: [Yes/No]

## 🔧 Implementation Ideas
If you have technical ideas about implementation:
- Suggested approach
- Potential libraries/tools
- Integration points
- Testing strategy

## 📚 Related Features
- Does this relate to existing features?
- Will this affect other parts of the CLI?
- Dependencies on external services?

## 🎨 User Experience
Describe the expected user experience:
- Command syntax
- Output format
- Error messages
- Help text

## 🔗 References
- Similar features in other tools
- Relevant documentation
- Community discussions

---

*Thank you for your contribution! Feature requests help shape the future of MGZON CLI.*
