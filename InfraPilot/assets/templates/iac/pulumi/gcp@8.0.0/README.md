# genops-gcp: Pulumi (TypeScript) components for GCP

A reusable Pulumi component set for Google Cloud, mirroring the genops Terraform
`google` module coverage. Each component is a `pulumi.ComponentResource` subclass
with a typed `Args` interface, sensible defaults, and useful outputs exposed as
public readonly fields.

## Components

| Component         | File                              | Resources |
| ----------------- | --------------------------------- | --------- |
| `VpcNetwork`      | `components/vpcNetwork.ts`        | VPC network + subnetwork (auto-subnets disabled) |
| `Firewall`        | `components/firewall.ts`          | Firewall rule (TCP allow) |
| `GcsBucket`       | `components/gcsBucket.ts`         | GCS bucket (uniform access + versioning) |
| `Secret`          | `components/secret.ts`            | Secret Manager secret (automatic replication) |
| `ServiceAccount`  | `components/serviceAccount.ts`    | IAM service account |
| `ComputeInstance` | `components/computeInstance.ts`   | Compute Engine VM |
| `CloudRun`        | `components/cloudRun.ts`          | Cloud Run v2 service |
| `CloudSql`        | `components/cloudSql.ts`          | Cloud SQL instance + database + user |
| `CloudFunction`   | `components/cloudFunction.ts`     | Cloud Functions (2nd gen) function |
| `ArtifactRegistry` | `components/artifactRegistry.ts` | Artifact Registry repository (Docker by default) |

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/install/) (`pulumi version`)
- [Node.js](https://nodejs.org/) 18+ and npm (`node --version`)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and authenticated
  application-default credentials:

  ```sh
  gcloud auth application-default login
  gcloud config set project <your-project-id>
  ```

## Setup

```sh
npm install
```

Configure the target project and region (or edit `Pulumi.dev.yaml`):

```sh
pulumi stack init dev
pulumi config set gcp:project <your-project-id>
pulumi config set gcp:region us-central1
```

## Deploy

```sh
pulumi up
```

To tear everything down:

```sh
pulumi destroy
```

## Usage

The example program in `index.ts` wires a VPC network, a firewall rule, and a GCS
bucket. Import the component classes you need and pass values via `Args`:

```ts
import { VpcNetwork } from "./components/vpcNetwork";
import { CloudRun } from "./components/cloudRun";

const vpc = new VpcNetwork("app", {
    networkName: "app-network",
    subnetName: "app-subnet",
    region: "us-central1",
    // subnetCidr defaults to "10.10.1.0/24"
});

const svc = new CloudRun("api", {
    serviceName: "api",
    location: "us-central1",
    image: "us-docker.pkg.dev/cloudrun/container/hello",
    // port defaults to 8080
});

export const apiUri = svc.serviceUri;
export const networkSelfLink = vpc.networkSelfLink;
```

### Notes

- No environment-specific values are hardcoded in the components; everything is
  passed via the `Args` interface.
- `Secret` creates the secret only; it never manages secret material. Add a
  `gcp.secretmanager.SecretVersion` separately, sourcing the value from Pulumi
  config (`--secret`) or an external store.
- `GcsBucket` enables uniform bucket-level access and object versioning by default.
