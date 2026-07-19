import * as pulumi from "@pulumi/pulumi";

import { ResourceGroup } from "./components/resourceGroup";
import { VirtualNetwork } from "./components/virtualNetwork";
import { StorageAccount } from "./components/storageAccount";

// Re-export every component so this package can be consumed as a library.
export { PostgresqlFlexibleServer, PostgresqlFlexibleServerArgs } from "./components/postgresqlFlexibleServer";
export { FunctionApp, FunctionAppArgs } from "./components/functionApp";
export { ContainerRegistry, ContainerRegistryArgs } from "./components/containerRegistry";

// Read the target location from stack config (azure-native:location), falling
// back to a sensible default. No environment-specific values are hardcoded.
const azureConfig = new pulumi.Config("azure-native");
const location = azureConfig.get("location") ?? "eastus2";

// 1. Resource group.
const rg = new ResourceGroup("genops-rg", {
  resourceGroupName: "genops-example-rg",
  location,
});

// 2. Virtual network + subnet within that resource group.
const vnet = new VirtualNetwork("genops-vnet", {
  vnetName: "genops-vnet",
  subnetName: "genops-subnet",
  resourceGroupName: rg.name,
  location: rg.location,
});

// 3. Storage account with safe defaults (HTTPS only, TLS 1.2 minimum).
const storage = new StorageAccount("genops-storage", {
  // Storage account names must be globally unique and 3-24 lowercase chars.
  storageAccountName: "genopsexamplesa01",
  resourceGroupName: rg.name,
  location: rg.location,
});

// Stack exports.
export const resourceGroupId = rg.id;
export const subnetId = vnet.subnetId;
export const storageAccountId = storage.id;
export const primaryBlobEndpoint = storage.primaryBlobEndpoint;
