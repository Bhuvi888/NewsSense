# Azure scheduled ingestion

This project uses an Azure Container Apps scheduled Job. It runs the existing
ingestion service three times per day and exits when the pass is complete.

The schedule in `container-apps-ingestion-job.yaml` is UTC:

- `03:00 UTC` = `08:30 IST`
- `11:00 UTC` = `16:30 IST`
- `19:00 UTC` = `00:30 IST` on the next day

## Why Azure Files is required

The application stores its Chroma vector database under
`CHROMA_PERSIST_DIRECTORY`. The API container and the scheduled job must mount
the same Azure Files share at `/app/chroma_data`; otherwise the job's vectors
will disappear when its container stops.

The MySQL database should also be an always-on reachable database, such as
Azure Database for MySQL Flexible Server. Do not use a container-local SQLite
database for this deployment.

## Deploy outline

1. Build and push the backend image to Azure Container Registry:

   ```powershell
   az acr build --registry <registry-name> --image newsense-backend:latest backend
   ```

2. Create an Azure Files share, register it with the Container Apps
   environment, and use its environment storage name in the YAML as
   `CHANGE_ME_ENVIRONMENT_STORAGE_NAME`.

3. Replace the `CHANGE_ME_*` values in `container-apps-ingestion-job.yaml`.
   Keep secrets out of Git. Prefer supplying the database URL and Groq keys
   through your deployment secret manager/CI instead of committing them to the
   YAML file.

4. Create the scheduled job:

   ```powershell
   az containerapp job create `
     --name newsense-ingestion `
     --resource-group <resource-group> `
     --yaml azure/container-apps-ingestion-job.yaml
   ```

5. Run it once manually before waiting for the schedule:

   ```powershell
   az containerapp job start `
     --name newsense-ingestion `
     --resource-group <resource-group>
   ```

6. Inspect logs and execution history:

   ```powershell
   az containerapp job execution list `
     --name newsense-ingestion `
     --resource-group <resource-group>
   ```

If your API is also running in Container Apps, configure its container with
the same Azure Files storage name and mount path. The Azure Container Apps
environment uses UTC for scheduled-job cron expressions.
