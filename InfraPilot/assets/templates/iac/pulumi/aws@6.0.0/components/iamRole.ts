import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/** Default trust policy: allows the EC2 service to assume the role. */
const DEFAULT_ASSUME_ROLE_POLICY = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
        {
            Effect: "Allow",
            Principal: {
                Service: "ec2.amazonaws.com",
            },
            Action: "sts:AssumeRole",
        },
    ],
});

/**
 * Arguments for the {@link IamRole} component.
 */
export interface IamRoleArgs {
    /** The name of the IAM role (also applied as the Name tag). */
    roleName: pulumi.Input<string>;
    /**
     * The trust policy (JSON) that grants an entity permission to assume the
     * role. Defaults to a policy allowing the EC2 service to assume the role.
     */
    assumeRolePolicy?: pulumi.Input<string>;
    /** Tags to apply to the IAM role. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * An IAM role with a configurable trust (assume-role) policy.
 */
export class IamRole extends pulumi.ComponentResource {
    /** The underlying IAM role resource. */
    public readonly role: aws.iam.Role;
    /** The IAM role name. */
    public readonly name: pulumi.Output<string>;
    /** The IAM role ARN. */
    public readonly roleArn: pulumi.Output<string>;

    constructor(name: string, args: IamRoleArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:IamRole", name, {}, opts);

        const tags = args.tags ?? {};

        this.role = new aws.iam.Role(`${name}-role`, {
            name: args.roleName,
            assumeRolePolicy: args.assumeRolePolicy ?? DEFAULT_ASSUME_ROLE_POLICY,
            tags: { ...tags, Name: args.roleName },
        }, { parent: this });

        this.name = this.role.name;
        this.roleArn = this.role.arn;

        this.registerOutputs({
            name: this.name,
            roleArn: this.roleArn,
        });
    }
}
