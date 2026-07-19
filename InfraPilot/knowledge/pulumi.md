# Pulumi (TypeScript): copy & wire-up

Detailed procedure for the bundled Pulumi component sets and `assets/templates/cicd/github/pulumi/` pipeline. One guide for all three providers. Pick the matching template directory:

- AWS: `assets/templates/iac/pulumi/aws@6.0.0/`
- Azure: `assets/templates/iac/pulumi/azure-native@2.0.0/`
- GCP: `assets/templates/iac/pulumi/gcp@8.0.0/`

Load this only when the request targets Pulumi.

## Layout to produce

Create everything under `<working-dir>/infrastructure/pulumi/`:

```
infrastructure/pulumi/
├── components/<name>.ts   # copied from assets/templates, one ComponentResource per resource
├── index.ts               # copied/edited - the program; imports + wires components
├── Pulumi.yaml            # copied - project name + nodejs runtime
├── Pulumi.<env>.yaml      # one stack config per environment (dev/test/prod)
├── package.json           # copied - @pulumi/pulumi + provider SDK pins
├── tsconfig.json          # copied - strict TS config
└── README.md              # create
```

Each resource is a **`ComponentResource` class** in a single `.ts` file under `components/` (e.g. `vpc.ts`, `securityGroup.ts`), exported with its `*Args` interface. Component file/class names are camelCase, not snake_case.

Available components:
- **aws@6.0.0:** `vpc`, `securityGroup`, `s3Bucket`, `kmsKey`, `iamRole`, `ec2Instance`, `appRunner`, `rdsInstance`, `lambdaFunction`, `ecrRepository`, `secretsManagerSecret`
- **azure-native@2.0.0:** `resourceGroup`, `virtualNetwork`, `networkSecurityGroup`, `storageAccount`, `keyVault`, `userAssignedIdentity`, `appService`, `containerApp`, `linuxVirtualMachine`, `windowsVirtualMachine`, `postgresqlFlexibleServer`, `functionApp`, `containerRegistry`
- **gcp@8.0.0:** `vpcNetwork`, `firewall`, `gcsBucket`, `computeInstance`, `cloudRun`, `serviceAccount`, `secret`, `cloudSql`, `cloudFunction`, `artifactRegistry`

## Steps

1. Copy `Pulumi.yaml`, `package.json`, `tsconfig.json` from the chosen provider's template dir to the pulumi root unchanged. Copy `index.ts` as the starting point.
2. For each resource the request needs, copy `components/<name>.ts` → `infrastructure/pulumi/components/<name>.ts`. Re-export it from `index.ts` (the templates re-export every component so the package is consumable as a library).
3. Edit `index.ts` to build the program in dependency order, passing one component's `Output` into the next (Pulumi infers the dependency graph from these references, so no explicit `dependsOn` needed):
   - **AWS:** `Vpc` → `SecurityGroup` (`vpcId: network.vpcId`) → `S3Bucket` / `Ec2Instance` (`subnetId`, `vpcSecurityGroupIds`).
   - **Azure:** `ResourceGroup` → `VirtualNetwork` (`resourceGroupName: rg.name`, `location: rg.location`) → `StorageAccount` / others scoped to the RG.
   - **GCP:** `VpcNetwork` → `Firewall` (`network: vpc.network.id`) → `GcsBucket` / `ComputeInstance`.
4. Read region/project/location and other env-specific values from **stack config**, not hardcoded literals, e.g. `new pulumi.Config("aws").get(...)`, `new pulumi.Config("azure-native").get("location")`, `new pulumi.Config("gcp").require("project")`. Export the useful ids/names via `export const ...` at the bottom.
5. Create a stack config per environment by copying `Pulumi.dev.yaml` → `Pulumi.test.yaml` / `Pulumi.prod.yaml` and adjusting the `config:` values (region, project, location). One stack per environment is how dev/test/prod are separated; there is no Terraform-style workspace.
6. **Run `npx tsc --noEmit` first**, before any preview. Pulumi SDK property names (e.g. `enableDnsHostnames`, `minimumTlsVersion`) must be compile-checked. A typo'd property is a TypeScript error, not a runtime one, so the type check catches wiring mistakes before they reach the cloud. `tsconfig.json` is `strict` with `noUnusedLocals`/`noUnusedParameters` on.

## Deploying

```bash
cd infrastructure/pulumi
npm ci
npx tsc --noEmit              # compile-check SDK property names FIRST
pulumi stack select dev      # or test / prod
pulumi preview               # dry run
pulumi up                    # apply
```

State is stored in the Pulumi service (or your configured backend) keyed by stack name, so each environment's state is isolated by its stack.

## Auth / secret conventions

- **`PULUMI_ACCESS_TOKEN`** authenticates the Pulumi CLI/service (state + secrets backend) and is always required.
- Per-cloud credentials are supplied as environment variables to the Pulumi runtime, exactly as each provider's SDK expects:
  - **AWS:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (region via stack config `aws:region`).
  - **Azure:** `ARM_CLIENT_ID`, `ARM_TENANT_ID`, `ARM_SUBSCRIPTION_ID` (mapped in CI from `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID`; supports OIDC).
  - **GCP:** `GOOGLE_CREDENTIALS` (project/region via stack config `gcp:project` / `gcp:region`).

## CI/CD

- **GitHub Actions:** copy `assets/templates/cicd/github/pulumi/` → `.github/workflows/` keeping the file names: `_pulumi-deploy.yml` (callable; the `_` prefix marks it internal per enterprise convention), `pulumi-validate.yml`, and `pulumi-{dev,test,prod}.yml`. The callable workflow runs `npm ci`, `npx tsc --noEmit`, `pulumi preview` (commented on the PR), then `pulumi up` on the deploy job gated by a GitHub Environment for test/prod.
- The callable workflow requires `PULUMI_ACCESS_TOKEN` and has the per-cloud credential lines **commented out**; uncomment and forward the right set (AWS / ARM / GOOGLE) from the per-env wrappers for your provider. Each wrapper maps `environment` → `stack`. Set required reviewers on the test/prod GitHub Environments for approval gating.
- **Azure DevOps:** copy `assets/templates/cicd/devops/pulumi/`: `_pulumi-deploy.yml` stage template (preview + Environment-gated up) plus thin `pulumi-{dev,test,prod}.yml` callers. Set `PULUMI_ACCESS_TOKEN` and per-cloud credential variables; configure Environment approvals for test/production.
- **Jenkins:** copy `assets/templates/cicd/jenkins/pulumi/Jenkinsfile`: declarative pipeline with an `ENVIRONMENT` choice parameter mapping to the stack (`npm ci` + `tsc --noEmit` → `pulumi preview` → gated `pulumi up --yes`); create the `pulumi-access-token` Jenkins credential and uncomment the per-cloud credential block (AWS / ARM / GOOGLE) for your provider.
