# Open-Sourcing Specification

This document outlines the steps required to safely transition this project from a private repository to a public open-source project. 

## 1. Security & Secrets Audit
Before making any codebase public, we must strictly ensure no sensitive information is leaked.
- **Scan for API Keys:** A recursive scan of the codebase was performed looking for `API_KEY`, `secret`, `token`, `password`, and `bearer`.
- **Review `.gitignore` files:** Ensure all `.env` files or temporary build artifacts are ignored.
- **Result:** **PASSED**. The scan confirmed there are no exposed secrets, API keys, or sensitive credentials hardcoded in the repository. (The only occurrences were in mock test strings).

## 2. Licensing
To be truly open-source, the project must have an explicit license granting users the right to use, modify, and distribute the code.
- Added a `LICENSE` file to the root of the project (MIT License).
- Updated the `"license"` field in `package.json` from `ISC` to `MIT`.

## 3. Package Metadata Updates
To link the future NPM package back to the public repository, the `package.json` must be updated with repository metadata. The following fields have been added:
- `"repository"`: Points to `https://github.com/dougmolineux/antigravity-wrapper-node`.
- `"bugs"`: Points to the repository's issue tracker.
- `"homepage"`: Points to the repository's README.

## 4. GitHub Configuration (Manual Steps)
The final step is to make the repository public on GitHub. **This must be done by the repository owner**:
1. Go to the GitHub repository **Settings**.
2. Scroll to the bottom to the **"Danger Zone"**.
3. Click **"Change repository visibility"** and change it to **"Public"**.
4. (Optional) Ensure GitHub Issues are enabled for community bug reporting.
