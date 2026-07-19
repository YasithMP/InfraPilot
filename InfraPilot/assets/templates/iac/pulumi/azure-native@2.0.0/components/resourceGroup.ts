import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";

/**
 * Arguments for the {@link ResourceGroup} component.
 */
export interface ResourceGroupArgs {
  /** The name of the resource group. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region) for the resource group. */
  location: pulumi.Input<string>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Resource Group.
 *
 * Mirrors the Terraform `resource_group` module.
 */
export class ResourceGroup extends pulumi.ComponentResource {
  /** The resource group resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The resource group name. */
  public readonly name: pulumi.Output<string>;
  /** The location the resource group lives in. */
  public readonly location: pulumi.Output<string>;

  constructor(name: string, args: ResourceGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:ResourceGroup", name, {}, opts);

    const rg = new resources.ResourceGroup(
      name,
      {
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = rg.id;
    this.name = rg.name;
    this.location = rg.location;

    this.registerOutputs({
      id: this.id,
      name: this.name,
      location: this.location,
    });
  }
}
