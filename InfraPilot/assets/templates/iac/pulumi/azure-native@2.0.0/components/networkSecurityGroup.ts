import * as pulumi from "@pulumi/pulumi";
import * as network from "@pulumi/azure-native/network";
import * as types from "@pulumi/azure-native/types";

/**
 * Arguments for the {@link NetworkSecurityGroup} component.
 */
export interface NetworkSecurityGroupArgs {
  /** The name of the network security group. */
  nsgName: pulumi.Input<string>;
  /** The resource group for the NSG. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /**
   * Optional security rules to attach to the NSG. Each rule maps directly to an
   * azure-native SecurityRuleArgs entry. Defaults to none.
   */
  securityRules?: pulumi.Input<pulumi.Input<types.input.network.SecurityRuleArgs>[]>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure Network Security Group.
 *
 * Mirrors the Terraform `network_security_group` module.
 */
export class NetworkSecurityGroup extends pulumi.ComponentResource {
  /** The network security group resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The network security group name. */
  public readonly name: pulumi.Output<string>;

  constructor(name: string, args: NetworkSecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:NetworkSecurityGroup", name, {}, opts);

    const nsg = new network.NetworkSecurityGroup(
      name,
      {
        networkSecurityGroupName: args.nsgName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        securityRules: args.securityRules,
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = nsg.id;
    this.name = nsg.name;

    this.registerOutputs({
      id: this.id,
      name: this.name,
    });
  }
}
