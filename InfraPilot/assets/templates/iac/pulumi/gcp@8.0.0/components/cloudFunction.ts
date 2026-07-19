import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link CloudFunction} component.
 */
export interface CloudFunctionArgs {
    /** The name of the Cloud Function. */
    functionName: pulumi.Input<string>;
    /** The location (region) for the function. */
    location: pulumi.Input<string>;
    /** The GCS bucket containing the source archive. */
    sourceBucket: pulumi.Input<string>;
    /** The GCS object (zip archive) containing the function source. */
    sourceObject: pulumi.Input<string>;
    /** The name of the exported function to execute. */
    entryPoint: pulumi.Input<string>;
    /** The runtime. Defaults to "nodejs20". */
    runtime?: pulumi.Input<string>;
    /** Memory available to each instance. Defaults to "256M". */
    availableMemory?: pulumi.Input<string>;
    /** Request timeout in seconds. Defaults to 60. */
    timeoutSeconds?: pulumi.Input<number>;
    /** Maximum number of instances. Defaults to 100. */
    maxInstances?: pulumi.Input<number>;
    /** Service account email the function runs as (uses the default when omitted). */
    serviceAccountEmail?: pulumi.Input<string>;
    /** Ingress settings. Defaults to "ALLOW_INTERNAL_ONLY". */
    ingressSettings?: pulumi.Input<string>;
    /** A map of labels to apply to the function. */
    labels?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A Cloud Functions (2nd gen) function deployed from a GCS source archive,
 * with ingress restricted to internal traffic by default.
 */
export class CloudFunction extends pulumi.ComponentResource {
    /** The underlying Cloud Functions v2 resource. */
    public readonly function: gcp.cloudfunctionsv2.Function;
    /** The fully-qualified name of the function. */
    public readonly functionName: pulumi.Output<string>;
    /** The URI of the underlying Cloud Run service. */
    public readonly functionUri: pulumi.Output<string>;

    constructor(name: string, args: CloudFunctionArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:CloudFunction", name, {}, opts);

        this.function = new gcp.cloudfunctionsv2.Function(`${name}-function`, {
            name: args.functionName,
            location: args.location,
            buildConfig: {
                runtime: args.runtime ?? "nodejs20",
                entryPoint: args.entryPoint,
                source: {
                    storageSource: {
                        bucket: args.sourceBucket,
                        object: args.sourceObject,
                    },
                },
            },
            serviceConfig: {
                availableMemory: args.availableMemory ?? "256M",
                timeoutSeconds: args.timeoutSeconds ?? 60,
                maxInstanceCount: args.maxInstances ?? 100,
                serviceAccountEmail: args.serviceAccountEmail,
                ingressSettings: args.ingressSettings ?? "ALLOW_INTERNAL_ONLY",
            },
            labels: args.labels,
        }, { parent: this });

        this.functionName = this.function.name;
        this.functionUri = this.function.serviceConfig.apply(config => config?.uri ?? "");

        this.registerOutputs({
            functionName: this.functionName,
            functionUri: this.functionUri,
        });
    }
}
