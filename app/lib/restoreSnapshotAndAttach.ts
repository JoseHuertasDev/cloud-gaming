import { EC2 } from "aws-sdk";
import { ec2, instanceId } from "./awsConfig";

export async function restoreLatestSnapshotAndAttach() {
  // Obtener la lista de snapshots ordenados por fecha de creación descendente
  const describeSnapshotsParams: EC2.DescribeSnapshotsRequest = {
    OwnerIds: ['self'],
    Filters: [
      { Name: 'status', Values: ['completed'] },
      { Name: 'description', Values: ['gaming-secondary-disk-snapshot'] }
    ]
  };
  const { Snapshots } = await ec2.describeSnapshots(describeSnapshotsParams).promise();
  if (!Snapshots) {
    console.log('No se encontraron snapshots completados.');
    return;
  }
  const sortedSnapshots = Snapshots.sort((a, b) => {
    const startTimeA = a.StartTime ? a.StartTime.getTime() : 0;
    const startTimeB = b.StartTime ? b.StartTime.getTime() : 0;
    return startTimeB - startTimeA;
  });
  
  if (sortedSnapshots.length === 0) {
    console.log('No se encontraron snapshots completados.');
    return;
  }

  // Tomar el último snapshot (el más reciente)
  const latestSnapshot = sortedSnapshots[0];
  const snapshotId = latestSnapshot.SnapshotId;
  if(!snapshotId) {
    throw new Error("Snapshot id is undefined")
  }

  // Crear un nuevo volumen a partir del snapshot
  const createVolumeParams: EC2.Types.CreateVolumeRequest = {
    SnapshotId: snapshotId,
    AvailabilityZone: "sa-east-1c",
    VolumeType: "gp3"
  };
  const { VolumeId } = await ec2.createVolume(createVolumeParams).promise();

  if (!VolumeId) {
    throw new Error('No se pudo crear el volumen a partir del snapshot.');
  }

  // Esperar a que el volumen esté disponible
  await ec2.waitFor('volumeAvailable', { VolumeIds: [VolumeId] }).promise();

  // Adjuntar el volumen a la instancia
  const attachVolumeParams: EC2.Types.AttachVolumeRequest = {
    InstanceId: instanceId,
    VolumeId,
    Device: "xvdf"
  };
  await ec2.attachVolume(attachVolumeParams).promise();

  console.log(`Último snapshot (${snapshotId}) restaurado y volumen adjuntado a la instancia ${instanceId}.`);

  const deleteSnapshotParams = {
    SnapshotId: snapshotId
  };
  await ec2.deleteSnapshot(deleteSnapshotParams).promise();

  console.log(`Snapshot (${snapshotId}) eliminado correctamente.`);
}
