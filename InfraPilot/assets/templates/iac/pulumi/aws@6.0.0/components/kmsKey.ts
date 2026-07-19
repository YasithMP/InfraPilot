import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link KmsKey} component.
 */
export interface KmsKeyArgs {
    /** The alias name for the KMS key (without the "alias/" prefix). */
    aliasName: pulumi.Input<string>;
    /** The description of the KMS key. Defaults to "Managed by Pulumi". */
    description?: pulumi.Input<string>;
    /** Days before the key is deleted after destruction. Defaults to 30. */
    deletionWindowInDays?: pulumi.Input<number>;
    /** Tags to apply to the KMS key. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A KMS key with automatic key rotation enabled and a friendly alias.
 */
export class KmsKey extends pulumi.ComponentResource {
    /** The underlying KMS key resource. */
    public readonly key: aws.kms.Key;
    /** The underlying KMS alias resource. */
    public readonly alias: aws.kms.Alias;
    /** The KMS key ID. */
    public readonly keyId: pulumi.Output<string>;
    /** The KMS key ARN. */
    public readonly keyArn: pulumi.Output<string>;
    /** The KMS alias ARN. */
    public readonly aliasArn: pulumi.Output<string>;

    constructor(name: string, args: KmsKeyArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:KmsKey", name, {}, opts);

        this.key = new aws.kms.Key(`${name}-key`, {
            description: args.description ?? "Managed by Pulumi",
            deletionWindowInDays: args.deletionWindowInDays ?? 30,
            enableKeyRotation: true,
            tags: args.tags ?? {},
        }, { parent: this });

        this.alias = new aws.kms.Alias(`${name}-alias`, {
            name: pulumi.interpolate`alias/${args.aliasName}`,
            targetKeyId: this.key.keyId,
        }, { parent: this });

        this.keyId = this.key.keyId;
        this.keyArn = this.key.arn;
        this.aliasArn = this.alias.arn;

        this.registerOutputs({
            keyId: this.keyId,
            keyArn: this.keyArn,
            aliasArn: this.aliasArn,
        });
    }
}
