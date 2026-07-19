import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link GcsBucket} component.
 */
export interface GcsBucketArgs {
    /** Globally unique GCS bucket name. */
    bucketName: pulumi.Input<string>;
    /** The location of the bucket (region, dual-region, or multi-region). Defaults to "US". */
    location?: pulumi.Input<string>;
    /** A map of labels to apply to the bucket. */
    labels?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A GCS bucket with uniform bucket-level access and object versioning enabled
 * by default (safe defaults).
 */
export class GcsBucket extends pulumi.ComponentResource {
    /** The underlying storage bucket resource. */
    public readonly bucket: gcp.storage.Bucket;
    /** The name of the bucket. */
    public readonly name: pulumi.Output<string>;
    /** The base URL of the bucket (gs://...). */
    public readonly bucketUrl: pulumi.Output<string>;
    /** The URI (self link) of the bucket. */
    public readonly bucketSelfLink: pulumi.Output<string>;

    constructor(name: string, args: GcsBucketArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:GcsBucket", name, {}, opts);

        this.bucket = new gcp.storage.Bucket(`${name}-bucket`, {
            name: args.bucketName,
            location: args.location ?? "US",
            uniformBucketLevelAccess: true,
            versioning: {
                enabled: true,
            },
            labels: args.labels,
        }, { parent: this });

        this.name = this.bucket.name;
        this.bucketUrl = this.bucket.url;
        this.bucketSelfLink = this.bucket.selfLink;

        this.registerOutputs({
            name: this.name,
            bucketUrl: this.bucketUrl,
            bucketSelfLink: this.bucketSelfLink,
        });
    }
}
