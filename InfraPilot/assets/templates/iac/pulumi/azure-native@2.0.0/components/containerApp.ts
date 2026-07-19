import * as pulumi from "@pulumi/pulumi";
import * as app from "@pulumi/azure-native/app";

/**
 * Arguments for the {@link ContainerApp} component.
 */
export interface ContainerAppArgs {
  /** The name of the Azure Container App. */
  containerAppName: pulumi.Input<string>;
  /** The resource group for the container app. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** The Container App Environment (managed environment) ID. */
  containerAppEnvironmentId: pulumi.Input<string>;
  /** The container name in the app template. */
  containerName: pulumi.Input<string>;
  /** The container image to run. */
  containerImage: pulumi.Input<string>;
  /** Revision mode for the container app. Defaults to "Single". */
  revisionMode?: pulumi.Input<string>;
  /** Whether ingress is externally accessible. Defaults to true. */
  ingressExternalEnabled?: pulumi.Input<boolean>;
  /** Port exposed by the container. Defaults to 80. */
  targetPort?: pulumi.Input<number>;
  /** CPU allocation for the container (cores). Defaults to 0.5. */
  containerCpu?: pulumi.Input<number>;
  /** Memory allocation for the container (e.g. "1Gi"). Defaults to "1Gi". */
  containerMemory?: pulumi.Input<string>;
  /** Minimum number of container app replicas. Defaults to 1. */
  minReplicas?: pulumi.Input<number>;
  /** Maximum number of container app replicas. Defaults to 2. */
  maxReplicas?: pulumi.Input<number>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Container App.
 *
 * Mirrors the Terraform `container_app` module.
 */
export class ContainerApp extends pulumi.ComponentResource {
  /** The container app resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The container app name. */
  public readonly name: pulumi.Output<string>;
  /** The latest revision FQDN (when ingress is configured). */
  public readonly latestRevisionFqdn: pulumi.Output<string | undefined>;

  constructor(name: string, args: ContainerAppArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:ContainerApp", name, {}, opts);

    const revisionMode = args.revisionMode ?? "Single";
    const ingressExternal = args.ingressExternalEnabled ?? true;
    const targetPort = args.targetPort ?? 80;
    const containerCpu = args.containerCpu ?? 0.5;
    const containerMemory = args.containerMemory ?? "1Gi";
    const minReplicas = args.minReplicas ?? 1;
    const maxReplicas = args.maxReplicas ?? 2;

    const containerApp = new app.ContainerApp(
      name,
      {
        containerAppName: args.containerAppName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        managedEnvironmentId: args.containerAppEnvironmentId,
        configuration: {
          activeRevisionsMode: revisionMode,
          ingress: {
            external: ingressExternal,
            targetPort: targetPort,
            transport: app.IngressTransportMethod.Auto,
            traffic: [
              {
                latestRevision: true,
                weight: 100,
              },
            ],
          },
        },
        template: {
          containers: [
            {
              name: args.containerName,
              image: args.containerImage,
              resources: {
                cpu: containerCpu,
                memory: containerMemory,
              },
            },
          ],
          scale: {
            minReplicas: minReplicas,
            maxReplicas: maxReplicas,
          },
        },
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = containerApp.id;
    this.name = containerApp.name;
    this.latestRevisionFqdn = containerApp.latestRevisionFqdn;

    this.registerOutputs({
      id: this.id,
      name: this.name,
      latestRevisionFqdn: this.latestRevisionFqdn,
    });
  }
}
