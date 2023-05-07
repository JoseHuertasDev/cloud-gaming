import { ec2, instanceId } from "./awsConfig";

export async function getInstancePublicIp(): Promise<string | undefined> {
    const params = {
        InstanceIds: [instanceId]
    };

    const data = await ec2.describeInstances(params).promise();
    if (!data.Reservations || data.Reservations.length === 0) {
        return;
    }
    const reservation = data.Reservations[0];
    if (!reservation.Instances || reservation.Instances.length === 0) {
        return;
    }
    const instance = reservation.Instances[0];
    const publicIp = instance?.PublicIpAddress;
    return publicIp;
}
