import { ec2, instanceId } from "./awsConfig";

export async function stopInstance(): Promise<void> {
    const params = {
        InstanceIds: [instanceId],
        Force: true
    };

    await ec2.stopInstances(params).promise();
}