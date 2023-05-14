import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { Form, useLoaderData, useRevalidator } from "@remix-run/react";
import { getInstanceData, getInstanceState, getInstancePublicIp, getInstanceUptime } from "~/lib/getInstanceInfo";
import { useInterval } from "./utils";
import { startInstance } from "~/lib/startInstance";
import { stopInstance } from "~/lib/stopInstance";
import { instanceId } from "~/lib/awsConfig";
import { createSnapshotDetachAndDelete } from "~/lib/createSnapshotDetachAndDelete";
import { restoreLatestSnapshotAndAttach } from "~/lib/restoreSnapshotAndAttach";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();

  const actionToDo = formData.get("actionToDo");
  if (actionToDo === "start") {
    await restoreLatestSnapshotAndAttach();
    await startInstance();
  } 
  if (actionToDo === "stop") {
    await stopInstance();
  }
  if (actionToDo === "snapshot-and-delete-disk") {
    console.log(await createSnapshotDetachAndDelete());
  }

  await getInstanceData();
  return json({ instanceState: await getInstanceState(), instanceId, ip: await getInstancePublicIp(), uptime: await getInstanceUptime() });
};
export const loader = async ({ request }: LoaderArgs) => {
  await getInstanceData();
  return json({ instanceState: await getInstanceState(), instanceId, ip: await getInstancePublicIp(), uptime: await getInstanceUptime() });
};
export default function Index() {
  const revalidator = useRevalidator();
  useInterval(() => {
    revalidator.revalidate()
  }, 2000);
  const data = useLoaderData<typeof loader>();
  const isRunning = data.instanceState === "running";
  const isStopped = data.instanceState === "stopped";
  const uptime = data.instanceState === "running" ? data.uptime : '--:--:--';

  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <Form method="post" className="max-w-md w-full space-y-8 p-8 bg-white rounded-md shadow-lg">
        <h2 className="text-center font-medium text-xl">Instance ID: {data.instanceId}</h2>
        <h2 className="text-center font-medium text-xl">IP: {data.ip}</h2>
        <h2 className="text-center font-medium text-xl">Uptime: {uptime}</h2>

        <div className="text-center text-lg font-semibold">{`Instance State: ${data.instanceState}`}</div>
        <div className="flex justify-center">
          <button
            type="submit"
            name="actionToDo"
            value="start"
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${!isStopped ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isStopped}
          >
            Start Instance
          </button>
          <button
            type="submit"
            name="actionToDo"
            value="stop"
            className={`mx-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${!isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isRunning}
          >
            Stop Instance
          </button>
          <button
            type="submit"
            name="actionToDo"
            value="snapshot-and-delete-disk"
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${!isStopped ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isStopped}
          >
            Move disk to snapshot
          </button>
        </div>
      </Form>
    </main>
  );
}
