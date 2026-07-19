import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link S3Bucket} component.
 */
export interface S3BucketArgs {
    /** Globally unique S3 bucket name. */
    bucketName: pulumi.Input<string>;
    /** Tags to apply to the S3 bucket. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * An S3 bucket with versioning, AES256 server-side encryption and all public
 * access blocked by default.
 */
export class S3Bucket extends pulumi.ComponentResource {
    /** The underlying S3 bucket resource. */
    public readonly bucket: aws.s3.BucketV2;
    /** The bucket ID (name). */
    public readonly bucketId: pulumi.Output<string>;
    /** The bucket ARN. */
    public readonly bucketArn: pulumi.Output<string>;

    constructor(name: string, args: S3BucketArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:S3Bucket", name, {}, opts);

        const tags = args.tags ?? {};

        this.bucket = new aws.s3.BucketV2(`${name}-bucket`, {
            bucket: args.bucketName,
            tags: { ...tags, Name: args.bucketName },
        }, { parent: this });

        new aws.s3.BucketVersioningV2(`${name}-versioning`, {
            bucket: this.bucket.id,
            versioningConfiguration: {
                status: "Enabled",
            },
        }, { parent: this });

        new aws.s3.BucketServerSideEncryptionConfigurationV2(`${name}-sse`, {
            bucket: this.bucket.id,
            rules: [{
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "AES256",
                },
            }],
        }, { parent: this });

        new aws.s3.BucketPublicAccessBlock(`${name}-pab`, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });

        this.bucketId = this.bucket.id;
        this.bucketArn = this.bucket.arn;

        this.registerOutputs({
            bucketId: this.bucketId,
            bucketArn: this.bucketArn,
        });
    }
}
