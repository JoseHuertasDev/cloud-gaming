import { instanceId, ec2 } from "./awsConfig";
import { getInstanceData, getInstanceState } from "./getInstanceInfo";

export async function startInstance(): Promise<void> {
  await getInstanceData();
  const state = getInstanceState();
  if (state !== 'stopped') throw new Error("Cannot start an instance that is not stopped");
  await ec2.startInstances({InstanceIds: [instanceId]}).promise();
}