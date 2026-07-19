import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Arguments for the {@link SecurityGroup} component.
 */
export interface SecurityGroupArgs {
    /** The name of the security group (also applied as the Name tag). */
    name: pulumi.Input<string>;
    /** The VPC ID the security group belongs to. */
    vpcId: pulumi.Input<string>;
    /** Start port for the ingress rule. Defaults to 443. */
    ingressFromPort?: pulumi.Input<number>;
    /** End port for the ingress rule. Defaults to 443. */
    ingressToPort?: pulumi.Input<number>;
    /** Protocol for the ingress rule. Defaults to "tcp". */
    ingressProtocol?: pulumi.Input<string>;
    /** CIDR blocks allowed for inbound traffic. Defaults to ["0.0.0.0/0"]. */
    ingressCidrBlocks?: pulumi.Input<pulumi.Input<string>[]>;
    /** Start port for the egress rule. Defaults to 0. */
    egressFromPort?: pulumi.Input<number>;
    /** End port for the egress rule. Defaults to 0. */
    egressToPort?: pulumi.Input<number>;
    /** Protocol for the egress rule. "-1" allows all protocols. Defaults to "-1". */
    egressProtocol?: pulumi.Input<string>;
    /** CIDR blocks allowed for outbound traffic. Defaults to ["0.0.0.0/0"]. */
    egressCidrBlocks?: pulumi.Input<pulumi.Input<string>[]>;
    /** Tags to apply to the security group. */
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

/**
 * A security group with a single ingress and a single egress rule.
 */
export class SecurityGroup extends pulumi.ComponentResource {
    /** The underlying security group resource. */
    public readonly securityGroup: aws.ec2.SecurityGroup;
    /** The security group ID. */
    public readonly securityGroupId: pulumi.Output<string>;
    /** The security group name. */
    public readonly name: pulumi.Output<string>;

    constructor(name: string, args: SecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
        super("genops:aws:SecurityGroup", name, {}, opts);

        const tags = args.tags ?? {};

        this.securityGroup = new aws.ec2.SecurityGroup(`${name}-sg`, {
            name: args.name,
            vpcId: args.vpcId,
            ingress: [{
                description: "Inbound traffic",
                fromPort: args.ingressFromPort ?? 443,
                toPort: args.ingressToPort ?? 443,
                protocol: args.ingressProtocol ?? "tcp",
                cidrBlocks: args.ingressCidrBlocks ?? ["0.0.0.0/0"],
            }],
            egress: [{
                description: "Outbound traffic",
                fromPort: args.egressFromPort ?? 0,
                toPort: args.egressToPort ?? 0,
                protocol: args.egressProtocol ?? "-1",
                cidrBlocks: args.egressCidrBlocks ?? ["0.0.0.0/0"],
            }],
            tags: { ...tags, Name: args.name },
        }, { parent: this });

        this.securityGroupId = this.securityGroup.id;
        this.name = this.securityGroup.name;

        this.registerOutputs({
            securityGroupId: this.securityGroupId,
            name: this.name,
        });
    }
}
