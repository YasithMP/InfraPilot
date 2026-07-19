import { Vpc } from "./components/vpc";
import { SecurityGroup } from "./components/securityGroup";
import { S3Bucket } from "./components/s3Bucket";

// Re-export every component so this package can be consumed as a library.
export { Vpc, VpcArgs } from "./components/vpc";
export { SecurityGroup, SecurityGroupArgs } from "./components/securityGroup";
export { S3Bucket, S3BucketArgs } from "./components/s3Bucket";
export { KmsKey, KmsKeyArgs } from "./components/kmsKey";
export { IamRole, IamRoleArgs } from "./components/iamRole";
export { Ec2Instance, Ec2InstanceArgs } from "./components/ec2Instance";
export { AppRunner, AppRunnerArgs } from "./components/appRunner";
export { RdsInstance, RdsInstanceArgs } from "./components/rdsInstance";
export { LambdaFunction, LambdaFunctionArgs } from "./components/lambdaFunction";
export { EcrRepository, EcrRepositoryArgs } from "./components/ecrRepository";
export { SecretsManagerSecret, SecretsManagerSecretArgs } from "./components/secretsManagerSecret";

// ---------------------------------------------------------------------------
// Example program: a VPC + subnet, a security group inside it, and an
// encrypted, private S3 bucket. Adjust or remove for your own stack.
// ---------------------------------------------------------------------------

const tags = { Project: "genops-aws", ManagedBy: "pulumi" };

const network = new Vpc("genops", {
    vpcName: "genops-vpc",
    cidrBlock: "10.10.0.0/16",
    subnetName: "genops-subnet",
    subnetCidr: "10.10.1.0/24",
    tags,
});

const sg = new SecurityGroup("genops", {
    name: "genops-sg",
    vpcId: network.vpcId,
    ingressFromPort: 443,
    ingressToPort: 443,
    ingressProtocol: "tcp",
    ingressCidrBlocks: ["0.0.0.0/0"],
    tags,
});

const bucket = new S3Bucket("genops", {
    // Bucket names are globally unique; change this before deploying.
    bucketName: "genops-example-bucket-change-me",
    tags,
});

export const vpcId = network.vpcId;
export const subnetId = network.subnetId;
export const securityGroupId = sg.securityGroupId;
export const bucketArn = bucket.bucketArn;
