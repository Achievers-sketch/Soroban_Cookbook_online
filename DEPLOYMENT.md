# Deployment Guide

This document provides comprehensive information about deploying the Soroban Cookbook documentation.

## GitHub Pages Deployment

### Overview

The documentation is automatically deployed to GitHub Pages on every push to the `main` branch via GitHub Actions. The workflow is defined in `.github/workflows/deploy.yml`.

### Prerequisites

Before the workflow can successfully deploy, ensure the following repository settings are configured:

#### 1. Enable GitHub Pages

1. Navigate to your repository settings
2. Go to **Settings → Pages**
3. Under "Build and deployment":
   - Set **Source** to "GitHub Actions"
   - This allows the workflow to deploy built artifacts

#### 2. Configure Workflow Permissions

1. Go to **Settings → Actions → General**
2. Under "Workflow permissions":
   - Select "Read and write permissions"
   - Enable "Allow GitHub Actions to create and approve pull requests"
3. This grants the workflow necessary permissions to deploy

#### 3. Set Up Branch Protection (Recommended)

1. Go to **Settings → Branches**
2. Add a rule for the `main` branch:
   - Require status checks to pass before merging
   - Select the "build" job from the deploy workflow
   - This ensures only successful builds are merged

### Workflow Details

**Trigger Events:**

- Push to `main` branch
- Manual trigger via "Run workflow" button in Actions tab

**Build Process:**

1. Checkout code
2. Setup Bun
3. Install dependencies using `bun install --frozen-lockfile`
4. Build documentation with `bun run build`
5. Upload build artifact to GitHub Pages

**Deployment Process:**

1. Configure GitHub Pages environment
2. Deploy artifact to GitHub Pages
3. Deployment URL available in workflow run details

### Monitoring Deployments

1. Go to **Actions** tab in your repository
2. Select the "Deploy to GitHub Pages" workflow
3. View recent runs and their status
4. Click on a run to see detailed logs

### Troubleshooting

#### Workflow Fails with "Pages is not enabled"

**Solution:** Ensure GitHub Pages source is set to "GitHub Actions" in repository settings.

#### Deployment Skipped

**Solution:** Check that:

- You're pushing to the `main` branch
- Workflow permissions are set to "Read and write"
- No branch protection rules are blocking the deployment

#### Build Fails

**Solution:** Check the workflow logs for specific errors:

1. Go to Actions tab
2. Click on the failed run
3. Expand the "Build website" step to see error details

Common issues:

- Missing dependencies: Run `bun install --frozen-lockfile` locally to verify
- TypeScript errors: Run `bun run typecheck` locally
- Build errors: Run `bun run build` locally to reproduce

#### Artifact Upload Fails

**Solution:** Verify that:

- The build directory exists at `documentation/build`
- Build completed successfully (check previous step logs)
- Sufficient storage quota available

### Manual Deployment

To manually trigger a deployment:

1. Go to **Actions** tab
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select the branch (usually `main`)
5. Click "Run workflow"

### Rollback

GitHub Pages automatically serves the latest deployment. To rollback:

1. Revert the problematic commit on `main`
2. Push the revert commit
3. The workflow will automatically deploy the previous version

## Local Development

### Building Locally

```bash
cd documentation
bun install
bun run build
```

The built site will be in `documentation/build/`.

### Serving Locally

```bash
cd documentation
bun run serve
```

Visit `http://localhost:3000` to view the built site.

### Development Server

```bash
cd documentation
bun start
```

This starts a live-reload development server at `http://localhost:3000`.

## Environment Variables

Currently, no environment variables are required for deployment. The workflow uses:

- Bun (specified in workflow)
- Docusaurus build configuration from `documentation/docusaurus.config.ts`

## Performance Considerations

- Build time: ~2-3 minutes (depends on content size)
- Artifact size: ~5-10 MB (typical for Docusaurus sites)
- Deployment time: ~1-2 minutes

## Security

### Content Security Policy (CSP)

The documentation site is protected by a strict Content-Security-Policy that prevents XSS and injection attacks.

**CSP Implementation:**
- Meta tag added to all pages via Docusaurus configuration (`documentation/docusaurus.config.ts`)
- Static `_headers` file provided for edge deployment compatibility
- Additional security headers configured for defense-in-depth

**Key Directives:**
- `default-src 'self'`: All content from same origin
- `script-src 'self' 'wasm-unsafe-eval'`: Scripts from same origin (wasm needed for Docusaurus)
- `style-src 'self' 'unsafe-inline'`: Styles from same origin with inline support (required for theming)
- `frame-ancestors 'none'`: Prevents clickjacking
- Other headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`

See [SECURITY.md](./SECURITY.md) for detailed CSP documentation and testing instructions.

### Workflow Security

- Workflow uses `actions/checkout@v4` (latest stable)
- Permissions are minimal: `contents: read`, `pages: write`, `id-token: write`
- No secrets required for GitHub Pages deployment
- All code is built from the repository source

## Future Improvements

- [ ] Add build caching to speed up deployments
- [ ] Add performance metrics collection
- [ ] Implement preview deployments for pull requests
- [ ] Add automated lighthouse audits
- [ ] Set up deployment notifications

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review workflow logs in the Actions tab
3. Open an issue on GitHub with workflow logs attached
4. Join the [Stellar Discord](https://discord.gg/stellardev) for community support
