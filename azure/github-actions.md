# GitHub Actions deployment

`.github/workflows/deploy-azure.yml` deploys on every push to `main` and can
also be started manually. It uses GitHub OIDC, so Azure credentials are not
stored as a client secret in GitHub.

## One-time Azure setup

Run these commands after replacing the repository and owner values:

```powershell
$az = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
$env:AZURE_CONFIG_DIR = "$PWD\.azure-config"
$subscription = "9a7cdcbf-16cd-417e-9f92-31edd9697eea"
$tenant = "9972863d-35df-4d3e-8c3f-f3b261abeef6"
$owner = "YOUR_GITHUB_OWNER"
$repo = "newsense"

& $az ad app create --display-name newsense-github-actions --query appId -o tsv
```

Save the returned application ID, then create its service principal and
federated credential. The federated subject below allows deployments from the
repository's `main` branch:

```powershell
$clientId = "YOUR_APPLICATION_ID"
& $az ad sp create --id $clientId
& $az role assignment create `
  --assignee $clientId `
  --role Contributor `
  --scope "/subscriptions/$subscription/resourceGroups/newsense-prod-sea"

& $az ad app federated-credential create `
  --id $clientId `
  --parameters "{\"name\":\"github-main\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"repo:$owner/$repo:ref:refs/heads/main\",\"audiences\":[\"api://AzureADTokenExchange\"]}"
```

## GitHub repository secrets

Add these repository secrets under Settings → Secrets and variables → Actions:

```text
AZURE_CLIENT_ID          = the application ID above
AZURE_TENANT_ID          = 9972863d-35df-4d3e-8c3f-f3b261abeef6
AZURE_SUBSCRIPTION_ID    = 9a7cdcbf-16cd-417e-9f92-31edd9697eea
```

The workflow builds images remotely with Azure Container Registry, so GitHub
runners do not need Docker. The API's existing Container Apps secrets and the
Chroma Azure Files mount remain attached when the image is updated.
