# genops-aws (Pulumi / TypeScript)

A Pulumi component set for AWS that mirrors the GenOps AWS Terraform module
coverage. Each module is a reusable `ComponentResource` subclass with a typed
`Args` interface and safe-by-default settings.

## Components

| Component       | File                              | Notes |
| --------------- | --------------------------------- | ----- |
| `Vpc`           | `components/vpc.ts`               | VPC + subnet, DNS support/hostnames enabled |
| `SecurityGroup` | `components/securityGroup.ts`     | One ingress + one egress rule |
| `S3Bucket`      | `components/s3Bucket.ts`          | Versioning, AES256 SSE, all public access blocked |
| `KmsKey`        | `components/kmsKey.ts`            | Key rotation enabled, friendly alias |
| `IamRole`       | `components/iamRole.ts`           | Configurable trust policy |
| `Ec2Instance`   | `components/ec2Instance.ts`       | Encrypted root volume |
| `AppRunner`     | `components/appRunner.ts`         | Container image service, auto-deploy off |
| `RdsInstance`   | `components/rdsInstance.ts`       | Encrypted DB instance, not publicly accessible |
| `LambdaFunction` | `components/lambdaFunction.ts`   | Function + CloudWatch log group |
| `EcrRepository` | `components/ecrRepository.ts`     | Immutable tags, scan on push, optional lifecycle policy |
| `SecretsManagerSecret` | `components/secretsManagerSecret.ts` | Secret + optional initial version |

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/install/) (v3+)
- [Node.js](https://nodejs.org/) 18+ and npm
- AWS credentials configured (e.g. `aws configure`, environment variables, or an
  assumed role). The region is read from stack config (`aws:region`).

## Getting started

```bash
npm install
pulumi stack init dev
pulumi config set aws:region us-east-1
pulumi up
```

`Pulumi.dev.yaml` ships with `aws:region: us-east-1` as an example; change it
for your own deployment.

## Usage

Import the component classes and instantiate them in `index.ts`:

```ts
import { Vpc } from "./components/vpc";
import { SecurityGroup } from "./components/securityGroup";
import { S3Bucket } from "./components/s3Bucket";

const network = new Vpc("genops", {
    vpcName: "genops-vpc",
    subnetName: "genops-subnet",
});

const sg = new SecurityGroup("genops", {
    name: "genops-sg",
    vpcId: network.vpcId,
});

const bucket = new S3Bucket("genops", {
    bucketName: "my-globally-unique-bucket",
});

export const bucketArn = bucket.bucketArn;
```

Each component exposes its underlying AWS resource(s) plus useful outputs as
public readonly fields (e.g. `network.vpcId`, `sg.securityGroupId`,
`bucket.bucketArn`). Pass all environment-specific values through the `Args`
interface; nothing is hardcoded inside the components.
