import { ec2, instanceId } from './awsConfig';

let instanceData: {
  state?: string;
  launchTime?: Date;
  publicIp?: string;
} = {};

function formatUptime(uptimeInSeconds: number): string {
  const hours = Math.floor(uptimeInSeconds / 3600);
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
  const seconds = uptimeInSeconds % 60;

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

export async function getInstanceData(): Promise<void> {
  const params = {
    InstanceIds: [instanceId]
  };
  const result = await ec2.describeInstances(params).promise();
  if (!result || !result.Reservations?.length || !result?.Reservations[0].Instances) {
    throw new Error("Could not get instance information");
  }
  const instance = result?.Reservations[0].Instances[0];
  instanceData.state = instance.State?.Name;
  instanceData.launchTime = instance.LaunchTime ? new Date(instance.LaunchTime) : undefined;
  instanceData.publicIp = instance.PublicIpAddress;
}

export function getInstanceState(): string | undefined {
  return instanceData.state;
}

export function getInstanceUptime(): string | undefined {
  if (!instanceData.launchTime) {
    return undefined;
  }

  const currentTime = new Date();
  const uptimeInSeconds = Math.floor((currentTime.getTime() - instanceData.launchTime.getTime()) / 1000);
  const formattedUptime = formatUptime(uptimeInSeconds);
  return formattedUptime;
}

export function getInstancePublicIp(): string | undefined {
  return instanceData.publicIp;
}