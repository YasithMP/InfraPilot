import * as pulumi from "@pulumi/pulumi";
import * as network from "@pulumi/azure-native/network";

/**
 * Arguments for the {@link VirtualNetwork} component.
 */
export interface VirtualNetworkArgs {
  /** The name of the virtual network. */
  vnetName: pulumi.Input<string>;
  /** The name of the subnet to create within the virtual network. */
  subnetName: pulumi.Input<string>;
  /** The resource group for the networking resources. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** Address space for the virtual network. Defaults to ["10.10.0.0/16"]. */
  addressSpace?: pulumi.Input<pulumi.Input<string>[]>;
  /** Address prefixes for the subnet. Defaults to ["10.10.1.0/24"]. */
  subnetPrefixes?: pulumi.Input<pulumi.Input<string>[]>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Virtual Network with a single subnet.
 *
 * Mirrors the Terraform `virtual_network` module.
 */
export class VirtualNetwork extends pulumi.ComponentResource {
  /** The virtual network resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The virtual network name. */
  public readonly name: pulumi.Output<string>;
  /** The subnet resource ID. */
  public readonly subnetId: pulumi.Output<string>;

  constructor(name: string, args: VirtualNetworkArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:VirtualNetwork", name, {}, opts);

    const addressSpace = args.addressSpace ?? ["10.10.0.0/16"];
    const subnetPrefixes = args.subnetPrefixes ?? ["10.10.1.0/24"];

    const vnet = new network.VirtualNetwork(
      name,
      {
        virtualNetworkName: args.vnetName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        addressSpace: { addressPrefixes: addressSpace },
        tags: args.tags,
      },
      { parent: this },
    );

    const subnet = new network.Subnet(
      `${name}-subnet`,
      {
        subnetName: args.subnetName,
        resourceGroupName: args.resourceGroupName,
        virtualNetworkName: vnet.name,
        addressPrefixes: subnetPrefixes,
      },
      { parent: this },
    );

    this.id = vnet.id;
    this.name = vnet.name;
    this.subnetId = subnet.id;

    this.registerOutputs({
      id: this.id,
      name: this.name,
      subnetId: this.subnetId,
    });
  }
}
