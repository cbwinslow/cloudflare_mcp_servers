# Contributing to Cloudflare MCP Servers

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

- **Clear title**: Summarize the problem
- **Description**: Detailed description of the bug
- **Steps to reproduce**: How to recreate the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Node version, OS, etc.
- **Logs**: Relevant error messages or logs

### Suggesting Features

We welcome feature suggestions! Please open an issue with:

- **Use case**: Why is this feature needed?
- **Proposal**: How should it work?
- **Alternatives**: Other approaches you've considered
- **Examples**: Code examples if applicable

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/cloudflare_mcp_servers.git
   cd cloudflare_mcp_servers
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the code style (see below)
   - Add tests if applicable
   - Update documentation
   - Test your changes

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Describe your changes
   - Link related issues

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for type safety
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code patterns
- Use async/await over callbacks
- Handle errors properly

#### Example

```typescript
// Good
async function fetchUserData(userId: string): Promise<UserData> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const data = await env.KV.get(`user:${userId}`, 'json');
  return data;
}

// Avoid
function getData(id) {
  return env.KV.get('user:' + id);
}
```

### File Organization

```
src/
  ├── index.ts          # Main entry point
  ├── handlers/         # Request handlers
  ├── tools/            # Tool implementations
  ├── resources/        # Resource providers
  └── utils/            # Utility functions

examples/
  ├── minimal-server.ts
  └── advanced-server.ts

docs/
  ├── ARCHITECTURE.md
  └── API_REFERENCE.md
```

### Documentation

- Add JSDoc comments to functions
- Update README for new features
- Add examples for complex features
- Keep docs in sync with code

#### Example

```typescript
/**
 * Execute a tool with the given arguments
 * 
 * @param name - Name of the tool to execute
 * @param args - Tool arguments
 * @param env - Environment bindings
 * @returns Tool execution result
 * @throws Error if tool not found or execution fails
 */
async function callTool(name: string, args: any, env: Env): Promise<ToolResult> {
  // Implementation
}
```

## Testing

### Manual Testing

```bash
# Test locally
npm run dev

# In another terminal
curl http://localhost:8787

# Test MCP methods
node scripts/test.js
```

### Adding Tests

If you add new features, please add corresponding tests:

```typescript
// Example test structure
async function testEchoTool() {
  const response = await fetch('http://localhost:8787', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'echo',
        arguments: { message: 'test' }
      },
      id: 1
    })
  });
  
  const result = await response.json();
  console.assert(result.result.content[0].text === 'test');
}
```

## Adding New Examples

We welcome new example implementations! Follow this structure:

```typescript
/**
 * Example: [Your Example Name]
 * 
 * Description: What this example demonstrates
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * 
 * Setup:
 * 1. Step 1
 * 2. Step 2
 */

export interface Env {
  // Environment bindings
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Implementation
  }
}
```

## Adding New Documentation

When adding documentation:

1. **Choose the right place**:
   - `docs/` for detailed guides
   - `README.md` for overview
   - `QUICK_REFERENCE.md` for quick snippets
   - Comments in code for implementation details

2. **Structure**:
   - Start with overview
   - Add table of contents for long docs
   - Use examples
   - Include troubleshooting

3. **Format**:
   - Use Markdown
   - Add code blocks with language
   - Use headers for organization
   - Include links to related docs

## Commit Message Guidelines

Use clear, descriptive commit messages:

### Format

```
<type>: <short summary>

<optional detailed description>

<optional footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat: add KV storage example

Added a new example demonstrating how to use Cloudflare KV
storage with MCP servers.

Closes #123
```

```
fix: handle missing parameters in echo tool

The echo tool was crashing when message parameter was missing.
Added validation to check for required parameters.
```

## Development Workflow

### 1. Setup Development Environment

```bash
# Install dependencies
npm install

# Configure environment
npm run setup

# Start dev server
npm run dev
```

### 2. Make Changes

- Edit files in `src/`, `examples/`, or `docs/`
- Test locally with `npm run dev`
- Check code works as expected

### 3. Build and Test

```bash
# Build TypeScript
npm run build

# Run tests
npm run test
```

### 4. Submit PR

- Push to your fork
- Open Pull Request
- Respond to review feedback
- Update PR as needed

## Code Review Process

When your PR is submitted:

1. **Automated checks** run (if configured)
2. **Maintainer review** - usually within a few days
3. **Feedback** - implement requested changes
4. **Approval** - once everything looks good
5. **Merge** - your contribution is merged!

## Areas We Need Help With

- 📝 **Documentation**: Improve existing docs or add new guides
- 🐛 **Bug fixes**: Fix reported issues
- ✨ **Examples**: Add more example implementations
- 🧪 **Testing**: Add test coverage
- 🎨 **UI/UX**: Improve error messages and output
- 🔧 **Features**: Implement requested features

## Questions?

If you have questions:

- Check existing documentation
- Search existing issues
- Open a new issue with your question
- Join community discussions

## Code of Conduct

Be respectful and constructive:

- Be welcoming to newcomers
- Respect differing viewpoints
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- Project documentation (where applicable)

---

Thank you for contributing! 🎉
