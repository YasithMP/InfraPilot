import * as pulumi from "@pulumi/pulumi";
import * as managedidentity from "@pulumi/azure-native/managedidentity";

/**
 * Arguments for the {@link UserAssignedIdentity} component.
 */
export interface UserAssignedIdentityArgs {
  /** The name of the user-assigned managed identity. */
  identityName: pulumi.Input<string>;
  /** The resource group for the managed identity. */
  resourceGroupName: pulumi.Input<string>;
  /** The Azure location (region). */
  location: pulumi.Input<string>;
  /** Optional resource tags. */
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * Azure User-Assigned Managed Identity.
 *
 * Mirrors the Terraform `user_assigned_identity` module.
 */
export class UserAssignedIdentity extends pulumi.ComponentResource {
  /** The managed identity resource ID. */
  public readonly id: pulumi.Output<string>;
  /** The service principal object (principal) ID. */
  public readonly principalId: pulumi.Output<string>;
  /** The application (client) ID. */
  public readonly clientId: pulumi.Output<string>;

  constructor(name: string, args: UserAssignedIdentityArgs, opts?: pulumi.ComponentResourceOptions) {
    super("genops:azure:UserAssignedIdentity", name, {}, opts);

    const identity = new managedidentity.UserAssignedIdentity(
      name,
      {
        resourceName: args.identityName,
        resourceGroupName: args.resourceGroupName,
        location: args.location,
        tags: args.tags,
      },
      { parent: this },
    );

    this.id = identity.id;
    this.principalId = identity.principalId;
    this.clientId = identity.clientId;

    this.registerOutputs({
      id: this.id,
      principalId: this.principalId,
      clientId: this.clientId,
    });
  }
}
