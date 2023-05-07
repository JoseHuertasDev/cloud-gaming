import { ec2, instanceId } from './awsConfig';

export async function getInstanceState(): Promise<string | undefined> {
    const params = {
      InstanceIds: [instanceId]
    };
    const result = await ec2.describeInstances(params).promise();
    if(!result || !result.Reservations?.length || !result?.Reservations[0].Instances) {
        throw new Error("Could not get instance status");
    }
    const instance = result?.Reservations[0].Instances[0];
    if(!instance.State) {
        throw new Error("Could not get instance status");
    }
    return instance.State.Name;
  }