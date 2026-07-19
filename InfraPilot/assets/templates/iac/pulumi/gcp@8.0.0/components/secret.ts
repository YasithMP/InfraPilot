import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link Secret} component.
 */
export interface SecretArgs {
    /** The ID of the secret (unique within the project). */
    secretId: pulumi.Input<string>;
    /** A map of labels to apply to the secret. */
    labels?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A Secret Manager secret with automatic replication.
 *
 * Note: this component intentionally does not manage secret versions/values —
 * no secret material is hardcoded. Add a {@link gcp.secretmanager.SecretVersion}
 * separately, sourcing the value from config or an external secret store.
 */
export class Secret extends pulumi.ComponentResource {
    /** The underlying secret resource. */
    public readonly secret: gcp.secretmanager.Secret;
    /** The user-provided secret ID. */
    public readonly secretId: pulumi.Output<string>;
    /** The fully-qualified resource name of the secret. */
    public readonly secretName: pulumi.Output<string>;

    constructor(name: string, args: SecretArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:Secret", name, {}, opts);

        this.secret = new gcp.secretmanager.Secret(`${name}-secret`, {
            secretId: args.secretId,
            replication: {
                auto: {},
            },
            labels: args.labels,
        }, { parent: this });

        this.secretId = this.secret.secretId;
        this.secretName = this.secret.name;

        this.registerOutputs({
            secretId: this.secretId,
            secretName: this.secretName,
        });
    }
}
