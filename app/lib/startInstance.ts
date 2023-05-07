import { instanceId, ec2 } from "./awsConfig";
import { getInstanceState } from "./getInstanceState";

export async function startInstance(): Promise<void> {
    const state = await getInstanceState();
    if(state !== 'stopped') throw new Error("Cannot start an instance that is not stopped")
    await ec2.startInstances({InstanceIds: [instanceId]}).promise();
}