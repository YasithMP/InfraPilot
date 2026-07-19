import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

import { VpcNetwork } from "./components/vpcNetwork";
import { Firewall } from "./components/firewall";
import { GcsBucket } from "./components/gcsBucket";

// Re-export every component so this package can be consumed as a library.
export { CloudSql, CloudSqlArgs } from "./components/cloudSql";
export { CloudFunction, CloudFunctionArgs } from "./components/cloudFunction";
export { ArtifactRegistry, ArtifactRegistryArgs } from "./components/artifactRegistry";

// Read the configured region (falls back to us-central1 if unset).
const gcpConfig = new pulumi.Config("gcp");
const region = gcpConfig.get("region") ?? "us-central1";
const project = gcpConfig.require("project");

// A VPC network with an explicitly managed subnetwork.
const vpc = new VpcNetwork("genops", {
    networkName: "genops-network",
    subnetName: "genops-subnet",
    region: region,
    subnetCidr: "10.10.1.0/24",
});

// A firewall rule allowing inbound SSH/HTTP/HTTPS, attached to the VPC above.
const firewall = new Firewall("genops", {
    name: "genops-allow-web",
    network: vpc.network.id,
    allowedPorts: ["22", "80", "443"],
    sourceRanges: ["0.0.0.0/0"],
});

// A GCS bucket with uniform bucket-level access and versioning (safe defaults).
// Bucket names are globally unique, so the project ID is used as a suffix.
const bucket = new GcsBucket("genops", {
    bucketName: pulumi.interpolate`genops-${project}-assets`,
    location: "US",
    labels: { managed_by: "pulumi", stack: pulumi.getStack() },
});

// Useful stack outputs.
export const networkName = vpc.name;
export const networkSelfLink = vpc.networkSelfLink;
export const subnetId = vpc.subnetId;
export const firewallName = firewall.name;
export const bucketName = bucket.name;
export const bucketUrl = bucket.bucketUrl;
