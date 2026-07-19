import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link ServiceAccount} component.
 */
export interface ServiceAccountArgs {
    /** The account ID for the service account (the local part of the email). */
    accountId: pulumi.Input<string>;
    /** A human-readable display name for the service account. */
    displayName: pulumi.Input<string>;
}

/**
 * A GCP IAM service account.
 */
export class ServiceAccount extends pulumi.ComponentResource {
    /** The underlying service account resource. */
    public readonly serviceAccount: gcp.serviceaccount.Account;
    /** The email address of the service account. */
    public readonly email: pulumi.Output<string>;
    /** The account ID (local part of the email). */
    public readonly accountId: pulumi.Output<string>;
    /** The IAM member identity string (e.g. "serviceAccount:<email>"). */
    public readonly member: pulumi.Output<string>;

    constructor(name: string, args: ServiceAccountArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:ServiceAccount", name, {}, opts);

        this.serviceAccount = new gcp.serviceaccount.Account(`${name}-sa`, {
            accountId: args.accountId,
            displayName: args.displayName,
        }, { parent: this });

        this.email = this.serviceAccount.email;
        this.accountId = this.serviceAccount.accountId;
        this.member = this.serviceAccount.member;

        this.registerOutputs({
            email: this.email,
            accountId: this.accountId,
            member: this.member,
        });
    }
}
