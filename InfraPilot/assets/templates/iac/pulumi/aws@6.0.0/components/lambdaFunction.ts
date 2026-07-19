import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link LambdaFunction} component.
 */
export interface LambdaFunctionArgs {
    /** The name of the Lambda function. */
    functionName: pulumi.Input<string>;
    /** The ARN of an existing IAM role the function assumes. */
    roleArn: pulumi.Input<string>;
    /** The runtime. Defaults to "nodejs20.x". */
    runtime?: pulumi.Input<string>;
    /** The handler entrypoint. Defaults to "index.handler". */
    handler?: pulumi.Input<string>;
    /** Memory size in MB. Defaults to 128. */
    memorySize?: pulumi.Input<number>;
    /** Timeout in seconds. Defaults to 3. */
    timeout?: pulumi.Input<number>;
    /** Deployment package as a Pulumi archive (e.g. `new pulumi.asset.FileArchive("./app.zip")`). */
    code?: pulumi.Input<pulumi.asset.Archive>;
    /** S3 bucket holding the deployment package (alternative to `code`). */
    s3Bucket?: pulumi.Input<string>;
    /** S3 key of the deployment package. */
    s3Key?: pulumi.Input<string>;
    /** Optional S3 object version of the deployment package. */
    s3ObjectVersion?: pulumi.Input<string>;
    /** Environment variables for the function. */
    environment?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
    /** CloudWatch log retention in days. Defaults to 14. */
    logRetentionDays?: pulumi.Input<number>;
    /** Tags to apply to the Lambda function and log group. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A Lambda function with an explicitly managed CloudWatch log group.
 *
 * The deployment package is supplied either as a local archive (`code`) or an
 * S3 object (`s3Bucket` + `s3Key`).
 */
export class LambdaFunction extends pulumi.ComponentResource {
    /** The underlying Lambda function resource. */
    public readonly function: aws.lambda.Function;
    /** The CloudWatch log group for the function. */
    public readonly logGroup: aws.cloudwatch.LogGroup;
    /** The Lambda function name. */
    public readonly functionName: pulumi.Output<string>;
    /** The Lambda function ARN. */
    public readonly functionArn: pulumi.Output<string>;
    /** The ARN used to invoke the function (e.g. from API Gateway). */
    public readonly invokeArn: pulumi.Output<string>;

    constructor(name: string, args: LambdaFunctionArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:LambdaFunction", name, {}, opts);

        const tags = args.tags ?? {};

        this.logGroup = new aws.cloudwatch.LogGroup(`${name}-logs`, {
            name: pulumi.interpolate`/aws/lambda/${args.functionName}`,
            retentionInDays: args.logRetentionDays ?? 14,
            tags,
        }, { parent: this });

        this.function = new aws.lambda.Function(`${name}-function`, {
            name: args.functionName,
            role: args.roleArn,
            runtime: args.runtime ?? "nodejs20.x",
            handler: args.handler ?? "index.handler",
            memorySize: args.memorySize ?? 128,
            timeout: args.timeout ?? 3,
            code: args.code,
            s3Bucket: args.s3Bucket,
            s3Key: args.s3Key,
            s3ObjectVersion: args.s3ObjectVersion,
            environment: args.environment === undefined ? undefined : {
                variables: args.environment,
            },
            tags: { ...tags, Name: args.functionName },
        }, { parent: this, dependsOn: [this.logGroup] });

        this.functionName = this.function.name;
        this.functionArn = this.function.arn;
        this.invokeArn = this.function.invokeArn;

        this.registerOutputs({
            functionName: this.functionName,
            functionArn: this.functionArn,
            invokeArn: this.invokeArn,
        });
    }
}
