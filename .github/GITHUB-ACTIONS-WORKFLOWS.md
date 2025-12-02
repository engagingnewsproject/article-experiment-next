# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating the deployment process.

## Available Workflows

### 1. Merge Main to Prod (`merge-to-prod.yml`)
A simple workflow that merges the `main` branch into the `prod` branch.

**Features:**
- Manual trigger with confirmation
- Basic merge functionality
- Success notifications

### 2. Merge Main to Prod (Advanced) (`merge-to-prod-advanced.yml`)
An enhanced workflow with additional safety checks and better error handling.

**Features:**
- Pre-merge validation checks
- Conflict detection
- Skip checks option for emergency deployments
- Detailed deployment notifications
- GitHub comments with deployment status

## How to Use

### Triggering a Manual Merge

1. **Go to the Actions tab** in your GitHub repository
2. **Select the workflow** you want to run:
   - "Merge Main to Prod" (simple)
   - "Merge Main to Prod (Advanced)" (recommended)
3. **Click "Run workflow"**
4. **Fill in the required fields:**
   - `confirm_merge`: Type "YES" to confirm
   - `skip_checks`: (Advanced only) Check to skip pre-merge checks
5. **Click "Run workflow"**

### Workflow Steps

#### Simple Workflow:
1. ✅ Verify confirmation input
2. 🔧 Configure Git user
3. 📥 Checkout prod branch
4. 🔀 Merge main into prod
5. 📤 Push to prod branch
6. ✅ Success notification

#### Advanced Workflow:
1. 🔍 **Pre-merge checks:**
   - Verify main is ahead of prod
   - Check for potential merge conflicts
2. ✅ Verify confirmation input
3. 🔧 Configure Git user
4. 📥 Checkout prod branch
5. 🔀 Merge main into prod
6. 📤 Push to prod branch
7. 📊 Deployment notification
8. 💬 GitHub comment with status

## Security Considerations

- **Confirmation Required**: You must type "YES" to confirm the merge
- **Token Permissions**: Uses `GITHUB_TOKEN` with repository permissions
- **Branch Protection**: Consider setting up branch protection rules for the `prod` branch
- **Required Reviews**: You can require pull request reviews before allowing merges

## Branch Protection Setup (Recommended)

To add extra security, set up branch protection for the `prod` branch:

1. Go to **Settings** → **Branches**
2. Click **Add rule** for the `prod` branch
3. Configure:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1 or more)
   - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
   - ✅ Include administrators

## Troubleshooting

### Common Issues

**Workflow fails with "Main branch is not ahead of prod"**
- This means there are no new commits in `main` that aren't already in `prod`
- Check if you actually need to deploy

**Workflow fails with merge conflicts**
- Resolve conflicts in a local branch first
- Push the resolved changes to `main`
- Then run the workflow again

**Permission denied errors**
- Ensure the workflow has proper permissions
- Check that `GITHUB_TOKEN` has write access to the repository

### Emergency Deployment

If you need to deploy urgently and skip checks:
1. Use the Advanced workflow
2. Check the "Skip pre-merge checks" option
3. Type "YES" to confirm
4. Run the workflow

⚠️ **Warning**: Skipping checks bypasses safety validations. Use only when necessary.

## Integration with Netlify

After the workflow successfully merges `main` into `prod`:
1. Netlify detects the push to the `prod` branch
2. Automatic deployment begins
3. You can monitor progress at: https://app.netlify.com/projects/article-experiment-next/overview
4. Live site updates at: https://article-experiment-next.netlify.app/

## Monitoring Deployments

- **Netlify Dashboard**: https://app.netlify.com/projects/article-experiment-next/overview
- **GitHub Actions**: Check the Actions tab for workflow status
- **Live Site**: https://article-experiment-next.netlify.app/ 