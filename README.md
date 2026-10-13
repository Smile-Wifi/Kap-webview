# Nitron WebView Builder — working build pipeline starter

This project replaces a simulated “queued” result with a real pipeline:

1. The Vercel dashboard validates an HTTPS URL, app name, package ID, orientation, and admin PIN.
2. The Vercel API securely dispatches a GitHub Actions workflow using a server-side GitHub token.
3. GitHub Actions generates a native Android WebView project and runs Gradle with Android SDK.
4. The actual APK is uploaded as a GitHub Actions artifact. If the repository is public, the workflow also publishes it as a GitHub Release asset.
5. The dashboard lists recent workflow runs and links to the real build logs/artifacts.

## Requirements

- GitHub account and a repository containing these files, with Actions enabled.
- Vercel account to deploy this repository.
- A GitHub fine-grained token with **Actions: Read and write** and **Contents: Read and write** on this repository. Store it only in Vercel environment variables; never in frontend code.
- For a signed release APK, create your own Android keystore and add the four signing secrets below.

## Deploy

1. Create a GitHub repository named `nitron-webview-builder` (public if you want anonymous direct release-asset downloads; private repositories require users to sign in to access Actions artifacts/releases).
2. Upload/push the complete contents of this folder to the repository's `main` branch. Ensure `.github/workflows/build-webview.yml` is included.
3. In GitHub, open **Settings → Actions → General** and allow GitHub Actions. The workflow needs repository contents write permission to publish a release when the repository is public.
4. In Vercel, import the same GitHub repository and deploy it.
5. In Vercel **Project → Settings → Environment Variables**, add:
   - `ADMIN_PIN`: a long, unique admin PIN/password (prefer 12+ random characters; it is a password despite the UI label).
   - `GITHUB_OWNER`: your GitHub username or organization.
   - `GITHUB_REPO`: the repository name.
   - `GITHUB_TOKEN`: the fine-grained token described above.
   - Optional `GITHUB_BRANCH`: branch containing the workflow (default `main`).
   - Optional `GITHUB_WORKFLOW_FILE`: workflow filename (default `build-webview.yml`).
6. Redeploy after setting environment variables.
7. Open your Vercel URL, enter your admin password, enter the app details, and click **Start real APK build**. Check status/logs after a short wait. Download the APK from the GitHub Actions run's **Artifacts** area, or from Releases if the repo is public.

## Signed release APK (recommended for distribution)

Create a keystore locally and keep a secure backup. Never commit it to GitHub. In GitHub **Settings → Secrets and variables → Actions → New repository secret**, add:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded keystore file
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_ALIAS`: key alias
- `ANDROID_KEY_PASSWORD`: key password

On Linux/macOS, encode the keystore with `base64 -w 0 my-release-key.jks` (on macOS, `base64 my-release-key.jks | tr -d '\n'`). On Windows PowerShell, use `[Convert]::ToBase64String([IO.File]::ReadAllBytes('my-release-key.jks'))`.

When all four secrets are present, the workflow builds a **signed release APK**. If they are absent/incomplete, it deliberately falls back to a debug APK. Never publish a debug APK as a production release. Keep the same keystore and alias for future updates to the same app; losing the key can prevent updating an installed app.

## Local dashboard development

Install Node.js and Vercel CLI, then run:

```bash
npm install -g vercel
vercel dev
```

Set the environment variables in Vercel project settings or a local `.env` file (do not commit `.env`).

## Important scope and limitations

- This version builds **HTTPS website wrappers**. It does not upload arbitrary HTML/ZIP assets yet.
- The WebView enables JavaScript and DOM storage, blocks mixed content, disables file/content access, and allows only HTTP/HTTPS navigation inside the WebView. Test login, downloads, payments, camera, microphone, geolocation, OAuth, and external-link flows individually; many sites need native permission handling or external-browser routing.
- The workflow currently outputs APKs, not Android App Bundles (AAB). AAB support can be added for Play Console distribution.
- A public GitHub repository exposes source code and release assets. Keep secrets in GitHub/Vercel secret stores. Never commit a signing key or API token.
- “Build submitted” means GitHub accepted the workflow dispatch. It does not mean compilation succeeded. Check the actual workflow result and install-test the APK on devices.
- This is a functional starter pipeline, not a certification that every generated app is production-ready or Play Store compliant. Before commercial use, add rate limiting, audit logging, a real admin identity system, privacy disclosures, app-specific icons/splash screens, download handling, and test coverage.
