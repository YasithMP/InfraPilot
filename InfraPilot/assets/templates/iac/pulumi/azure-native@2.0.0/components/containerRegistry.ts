import * as pulumi from "@pulumi/pulumi";
import * as containerregistry from "@pulumi/azure-native/containerregistry";

/**
 * Arguments for the {@link ContainerRegistry} component.
 */
export interface ContainerRegistryArgs {
  /** The name of the container registry (5-50 alphanumeric characters, globally unique). */
  registryName: pulumi.Input<string>;
  /** The resource group for the registry. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** The registry SKU. Defaults to "Basic". */
  sku?: pulumi.Input<containerregistry.SkuName | string>;
  /** Enable the admin user account. Defaults to false. */
  adminUserEnabled?: pulumi.Input<boolean>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Container Registry with the admin user disabled by default.
 *
 * Mirrors the Terraform `container_registry` module.
 */
export class ContainerRegistry extends pulumi.ComponentResource {
  /** The registry resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The registry name. */
  public readonly name: pulumi.Output<string>;
  /** The registry login server (e.g. "myregistry.azurecr.io"). */
  public readonly loginServer: pulumi.Output<string>;

  constructor(name: string, args: ContainerRegistryArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:ContainerRegistry", name, {}, opts);

    const sku = args.sku ?? containerregistry.SkuName.Basic;
    const adminUserEnabled = args.adminUserEnabled ?? false;

    const registry = new containerregistry.Registry(
      name,
      {
        registryName: args.registryName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        sku: { name: sku },
        adminUserEnabled: adminUserEnabled,
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = registry.id;
    this.name = registry.name;
    this.loginServer = registry.loginServer;

    this.registerOutputs({
      id: this.id,
      name: this.name,
      loginServer: this.loginServer,
    });
  }
}
