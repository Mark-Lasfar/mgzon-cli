# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported | End of Life | Notes |
|---------|-----------|-------------|-------|
| 2.x.x   | ✅ Yes    | 2025-12-31  | Current stable releases |
| 1.x.x   | ⚠️ Limited | 2024-12-31  | Security fixes only |
| 0.x.x   | ❌ No     | 2023-12-31  | Not supported |

### Release Channels

| Channel | Update Frequency | Stability | Recommended For |
|---------|------------------|-----------|-----------------|
| **Stable** (2.x.x) | Monthly | ⭐⭐⭐⭐⭐ | Production use |
| **Beta** (2.x.x-beta) | Weekly | ⭐⭐⭐⭐ | Early adopters |
| **Alpha** (nightly) | Daily | ⭐⭐ | Developers only |

## Reporting a Vulnerability

### How to Report

We take security vulnerabilities seriously. If you discover a security issue in MGZON CLI, please report it to us as follows:

**Preferred Method:**
1. **Email**: security@mgzon.com
2. **Subject**: `[SECURITY] MGZON CLI Vulnerability Report`
3. **Encryption**: You may encrypt your report using our [PGP key](#pgp-key)

**Include in your report:**
- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### What to Expect

#### Response Timeline
- **Initial Response**: Within 24 hours
- **Triage Complete**: Within 3 business days
- **Patch Development**: 1-4 weeks depending on severity
- **Public Disclosure**: After patch is available

#### Security Update Process
1. **Report Received**: Acknowledge receipt within 24 hours
2. **Investigation**: Our security team investigates the report
3. **Fix Development**: We develop and test a fix
4. **Coordination**: We may coordinate with you on disclosure
5. **Release**: We release the fix and update documentation
6. **Credit**: We credit reporters (unless they wish to remain anonymous)

### Scope of Security Issues

#### In Scope (We Want to Know About)
- Remote code execution
- Authentication bypass
- Privilege escalation
- Data leakage
- Injection attacks (SQL, command, etc.)
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)

#### Out of Scope
- UI/UX bugs
- Feature requests
- Documentation errors
- Theoretical vulnerabilities without proof of concept
- Issues in outdated/unsupported versions
- Social engineering attacks

## Security Best Practices

### For Users

#### Installation Security
```bash
# Always verify checksums
curl -LO https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v2.0.8/mgzon-linux
curl -LO https://github.com/Mark-Lasfar/mgzon-cli/releases/download/v2.0.8/mgzon-linux.sha256
sha256sum -c mgzon-linux.sha256
```

#### API Key Management
```bash
# Use environment variables instead of hardcoding
export MGZON_API_KEY="your-secret-key"

# Never commit API keys to git
echo "MGZON_API_KEY" >> .gitignore
```

#### Configuration Security
- Store `.mgzonrc` with appropriate file permissions (600)
- Regularly rotate API keys
- Use least-privilege API keys

### For Developers

#### Code Security
- All dependencies are scanned for vulnerabilities
- Regular security audits of the codebase
- Automated security testing in CI/CD pipeline

#### Build Security
- Reproducible builds
- Signed binaries
- Supply chain security verification

## Security Features

### Built-in Protections

#### 1. **Secure Authentication**
- Encrypted configuration storage
- API key validation and rotation
- Session timeout enforcement

#### 2. **Input Validation**
- Sanitization of all user inputs
- Command injection prevention
- Path traversal protection

#### 3. **Network Security**
- HTTPS enforcement for API calls
- Certificate pinning
- Rate limiting

#### 4. **Data Protection**
- Secure credential storage
- Memory-safe operations
- Secure deletion of sensitive data

### Security Monitoring

#### Logging
- Security event logging
- Failed authentication attempts
- Suspicious activity detection

#### Auditing
- Regular security audits
- Third-party penetration testing
- Automated vulnerability scanning

## PGP Key

For encrypted security reports:

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
Note: Contact security@mgzon.com to receive our PGP key
-----END PGP PUBLIC KEY BLOCK-----
```

## Responsible Disclosure Guidelines

### Our Commitment
We are committed to working with security researchers to:
- Respond quickly to vulnerability reports
- Validate and triage reports within 72 hours
- Develop patches and release updates promptly
- Publicly acknowledge your contribution (if desired)

### Your Commitment
When reporting vulnerabilities, we ask that you:
- Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our service
- Do not exploit a security vulnerability you discover for any reason
- Give us reasonable time to address the issue before making any information public
- Keep information about vulnerabilities confidential until we've had time to address them

## Security Updates

### Notification Methods

1. **GitHub Security Advisories**: https://github.com/Mark-Lasfar/mgzon-cli/security/advisories
2. **NPM Security Warnings**: Via `npm audit`
3. **Email Alerts**: For critical security updates (opt-in)
4. **Release Notes**: Security fixes documented in each release

### Update Process

```bash
# Always update to the latest secure version
npm update -g @mg-cli/cli

# Or download latest binaries
curl -LO https://github.com/Mark-Lasfar/mgzon-cli/releases/latest

# Check for security updates
npm audit
```

## Contact

- **Security Issues**: security@mgzon.com
- **General Support**: support@mgzon.com
- **Website**: https://mgzon.com/security
- **GitHub Security**: https://github.com/Mark-Lasfar/mgzon-cli/security

## Legal

By submitting a vulnerability report, you acknowledge that you have read and agree to our [responsible disclosure policy](#responsible-disclosure-guidelines). We will not take legal action against you for security research conducted in accordance with this policy.

---

*Last Updated: December 2024*
*Policy Version: 2.0*