import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { Form, useLoaderData, useRevalidator } from "@remix-run/react";
import { getInstanceState } from "~/lib/getInstanceState";
import { useInterval } from "./utils";
import { startInstance } from "~/lib/startInstance";
import { stopInstance } from "~/lib/stopInstance";
import { instanceId } from "~/lib/awsConfig";
import { getInstancePublicIp } from "~/lib/getInstanceIp";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();

  const actionToDo = formData.get("actionToDo");
  if (actionToDo === "start") {
    await startInstance();
  } else if (actionToDo === "stop") {
    await stopInstance();
  }

  return json({ instanceState: await getInstanceState(),instanceId, ip: await getInstancePublicIp() });
};
export const loader = async ({ request }: LoaderArgs) => {
  return json({ instanceState: await getInstanceState(),instanceId, ip: await getInstancePublicIp() });
};
export default function Index() {
  const revalidator = useRevalidator();
  useInterval(() => {
    revalidator.revalidate()
  }, 2000);
  const data = useLoaderData<typeof loader>();
  const isRunning = data.instanceState === "running";
  const isStopped = data.instanceState === "stopped";

  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <Form method="post" className="max-w-md w-full space-y-8 p-8 bg-white rounded-md shadow-lg">
        <h2 className="text-center font-medium text-xl">Instance ID: {data.instanceId}</h2>
        <h2 className="text-center font-medium text-xl">IP: {data.ip}</h2>

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
            className={`ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${!isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isRunning}
          >
            Stop Instance
          </button>
        </div>
      </Form>
    </main>
  );
}
