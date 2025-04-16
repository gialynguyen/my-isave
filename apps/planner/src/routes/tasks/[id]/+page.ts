import { jsonFetchWrapper } from '$lib/rpc/planner';

export const load = async ({ params, fetch }: { params: { id: string }; fetch: any }) => {
  const taskId = params.id;

  const task = await jsonFetchWrapper((client) => {
    return client.tasks[':id'].$get({
      param: {
        id: taskId
      }
    });
  }, fetch);

  if (!task) {
    throw new Error(`Task with id ${taskId} not found`);
  }

  return {
    task
  };
};
