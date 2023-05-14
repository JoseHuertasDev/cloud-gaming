import { EC2 } from "aws-sdk";
import { ec2, instanceId } from "./awsConfig";

async function findLargestVolume() {
    try {
      const describeVolumesParams: AWS.EC2.DescribeVolumesRequest = {
        Filters: [
          {
            Name: 'attachment.instance-id',
            Values: [instanceId]
          }
        ]
      };
      const volumes = await ec2.describeVolumes(describeVolumesParams).promise();
  
      if (!volumes.Volumes || volumes.Volumes.length === 0) {
        console.log('Not found volumes attached');
        return null;
      }
  
      let largestVolume: AWS.EC2.Volume | null = null;
      let largestSize = 0;
      for (const volume of volumes.Volumes) {
        if (volume.Size && volume.Size > largestSize) {
          largestVolume = volume;
          largestSize = volume.Size;
        }
      }
      return largestVolume?.VolumeId;
    } catch (error) {
      console.log("Error")
      return null;
    }
  }

async function detachVolume(instanceId: string, volumeId: string): Promise<void> {
  const detachVolumeParams: AWS.EC2.DetachVolumeRequest = {
    InstanceId: instanceId,
    VolumeId: volumeId
  };

  const detachResponse = await ec2.detachVolume(detachVolumeParams).promise();
  // Esperar a que la operación de desvinculación termine
  await ec2.waitFor('volumeAvailable', { VolumeIds: [volumeId] }).promise();

  console.log(`Volumen ${volumeId} desvinculado exitosamente de la instancia ${instanceId}.`);
}

async function createSnapshot(instanceId: string, volumeId: string): Promise<AWS.EC2.Snapshot | null> {
  try {
    const createSnapshotParams: AWS.EC2.CreateSnapshotRequest = {
      VolumeId: volumeId,
      Description: `gaming-secondary-disk-snapshot`,
    };

    const snapshot = await ec2.createSnapshot(createSnapshotParams).promise();

    if(!snapshot.SnapshotId){
      throw new Error("Snapshot couldnt be created")
    }
    const params: EC2.Types.DescribeSnapshotsRequest = {
      SnapshotIds: [snapshot.SnapshotId]
    }
    await ec2.waitFor('snapshotCompleted', { SnapshotIds: [snapshot.SnapshotId] }).promise();

    return snapshot;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function deleteVolume(volumeId: string): Promise<void> {
  const deleteVolumeParams: AWS.EC2.DeleteVolumeRequest = {
    VolumeId: volumeId
  };

  await ec2.deleteVolume(deleteVolumeParams).promise();
  console.log(`Volume ${volumeId} deleted successfully.`)
}

export async function createSnapshotDetachAndDelete() {

    const volumeId = await findLargestVolume()
    if(!volumeId) {
      throw new Error('No se encontro el volumen');
    }
    console.log("Volumen id ", volumeId)
    const snapshot = await createSnapshot(instanceId, volumeId);
    if (!snapshot) {
      throw new Error('No se pudo crear el snapshot.');
      return;
    }
    
    await detachVolume(instanceId, volumeId);

    await deleteVolume(volumeId);

    console.log('Snapshot creado, volumen desvinculado y volumen eliminado exitosamente.');
}
