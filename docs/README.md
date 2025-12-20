# MGZON CLI Documentation

Welcome to the MGZON CLI documentation. This comprehensive guide covers everything you need to know about installing, using, and understanding the MGZON Command Line Interface and Graphical User Interface.

## Repository Boundary: Public vs Private

### Public Repository (This Repository)
**Contains:**
- ✅ User installation guides and binaries
- ✅ API interface definitions (types only)
- ✅ Usage examples and workflows
- ✅ Architecture diagrams and explanations
- ✅ Troubleshooting guides
- ✅ Release notes and changelogs

**Does NOT contain:**
- ❌ Source code implementations
- ❌ Authentication logic
- ❌ API client code
- ❌ Internal business logic
- ❌ Database schemas
- ❌ Security credentials
- ❌ Build scripts and CI/CD configurations

### Private Repository (mgzon-cli-core)
**Contains:**
- Source code implementations
- Internal build and deployment scripts
- Authentication and security logic
- API integration code
- Database configurations
- Test suites with real credentials
- Internal documentation for developers

### Boundary Enforcement
- **Code Reviews**: All public repository changes reviewed for sensitive content
- **Automated Checks**: CI/CD pipelines scan for accidental exposure
- **Access Controls**: Private repository restricted to authorized developers
- **Documentation Reviews**: Ensure docs don't reveal implementation details

## Quick Start

- [Installation Guide](installation.mdx) - How to install MGZON CLI and GUI
- [User Flow Guide](user-flow.mdx) - Step-by-step workflows
- [End-to-End Flow](end-to-end-flow.mdx) - Complete user journey
- [Architecture Diagram](architecture-diagram.md) - High-level system overview

## Detailed Documentation

### For CLI Users
- Command reference and examples
- Configuration options
- Troubleshooting guide

### For GUI Users
- Interface overview
- Feature explanations
- Integration details

### For Developers
- [GUI-Backend Interaction](gui-backend-interaction.mdx) - How components communicate
- API integration patterns
- Extension development

## Architecture

### System Components
- CLI command processor
- GUI desktop application
- API communication layer
- Authentication system

### Data Flow
- User input processing
- Command execution
- API interactions
- Response handling

## Security & Privacy

For information about our security practices and privacy protection measures, see our [Privacy & Security Implementation Plan](../PRIVACY_SECURITY_PLAN.md).

## Support

- [GitHub Issues](https://github.com/Mark-Lasfar/mgzon-cli/issues) - Report bugs and request features
- [Documentation Issues](https://github.com/Mark-Lasfar/mgzon-cli/issues) - Report documentation problems
- Community Discord - Get help from the community

## Contributing

We welcome contributions to our documentation! Please see our contributing guide for details on how to help improve the MGZON CLI documentation.