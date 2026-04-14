# Deploying to Google Cloud Run from GitHub

This guide explains how to set up Continuous Deployment (CD) for this application from GitHub to Google Cloud Run.

## 1. Export to GitHub
1. Open the **Settings** (gear icon) in the AI Studio sidebar.
2. Click **Export to GitHub**.
3. Follow the prompts to connect your account and create a new repository.

## 2. Google Cloud Setup
You need a Service Account with permissions to deploy to Cloud Run and push to Artifact Registry.

### A. Enable APIs
Enable the following APIs in your GCP project:
- Cloud Run API
- Artifact Registry API
- Cloud Build API

### B. Create Artifact Registry
The GitHub Action expects a Docker repository named `cloud-run-source-deploy`.
1. Go to [Artifact Registry](https://console.cloud.google.com/artifacts).
2. Click **Create Repository**.
3. Name: `cloud-run-source-deploy`
4. Format: **Docker**
5. Location Type: **Region** (e.g., `us-central1` - must match the `REGION` in your `.yml` file).
6. Click **Create**.

### C. Create Service Account
1. Go to the [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) page.
2. Create a new Service Account (e.g., `github-deployer`).
3. Grant it the following roles:
   - **Cloud Run Admin**
   - **Artifact Registry Writer** (This fixes the "uploadArtifacts denied" error)
   - **Service Account User**
4. Create a **JSON Key** for this service account and download it.

## 3. GitHub Secrets
In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add the following secrets:

- `GCP_PROJECT_ID`: Your Google Cloud Project ID.
- `GCP_SA_KEY`: The entire content of the JSON key file you downloaded.

## 4. Automatic Deployment
Once these are set up, every push to the `main` branch will trigger the GitHub Action defined in `.github/workflows/google-cloud-run.yml`.

### Alternative: Direct Cloud Run Integration
If you prefer not to use GitHub Actions:
1. Go to the [Cloud Run Console](https://console.cloud.google.com/run).
2. Click **Create Service** or select your existing service.
3. Click **Set up Continuous Deployment**.
4. Select **GitHub** and follow the wizard. It will automatically create a Cloud Build trigger for you.
