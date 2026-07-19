import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for the {@link ArtifactRegistry} component.
 */
export interface ArtifactRegistryArgs {
    /** The repository ID (unique within the project and location). */
    repositoryId: pulumi.Input<string>;
    /** The location (region) for the repository. */
    location: pulumi.Input<string>;
    /** The repository format. Defaults to "DOCKER". */
    format?: pulumi.Input<string>;
    /** An optional description of the repository. */
    description?: pulumi.Input<string>;
    /** When set, adds a cleanup policy keeping only the most recent N versions. */
    keepMostRecentVersions?: number;
    /** A map of labels to apply to the repository. */
    labels?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * An Artifact Registry repository (Docker format by default) with an optional
 * keep-most-recent-N cleanup policy.
 */
export class ArtifactRegistry extends pulumi.ComponentResource {
    /** The underlying Artifact Registry repository resource. */
    public readonly repository: gcp.artifactregistry.Repository;
    /** The user-provided repository ID. */
    public readonly repositoryId: pulumi.Output<string>;
    /** The fully-qualified resource name of the repository. */
    public readonly repositoryName: pulumi.Output<string>;
    /** The registry URL for docker push/pull (Docker-format repositories). */
    public readonly repositoryUrl: pulumi.Output<string>;

    constructor(name: string, args: ArtifactRegistryArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:gcp:ArtifactRegistry", name, {}, opts);

        this.repository = new gcp.artifactregistry.Repository(`${name}-repo`, {
            repositoryId: args.repositoryId,
            location: args.location,
            format: args.format ?? "DOCKER",
            description: args.description,
            cleanupPolicies: args.keepMostRecentVersions === undefined ? undefined : [{
                id: "keep-most-recent",
                action: "KEEP",
                mostRecentVersions: {
                    keepCount: args.keepMostRecentVersions,
                },
            }],
            labels: args.labels,
        }, { parent: this });

        this.repositoryId = this.repository.repositoryId;
        this.repositoryName = this.repository.name;
        this.repositoryUrl = pulumi.interpolate`${this.repository.location}-docker.pkg.dev/${this.repository.project}/${this.repository.repositoryId}`;

        this.registerOutputs({
            repositoryId: this.repositoryId,
            repositoryName: this.repositoryName,
            repositoryUrl: this.repositoryUrl,
        });
    }
}
