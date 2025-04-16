import { jsonFetchWrapper } from '$lib/rpc/planner';

export const load = async ({
  params,
  fetch
}: {
  params: { shortId: string; name: string };
  fetch: any;
}) => {
  const shortId = params.shortId;

  const task = await jsonFetchWrapper((client) => {
    return client.tasks.byShortId[':shortId'].$get({
      param: {
        shortId
      }
    });
  }, fetch);

  if (!task) {
    throw new Error(`Task with shortId ${shortId} not found`);
  }

  // Check if the URL contains the correct task name
  const taskNameInUrl = params['name'];
  const taskNameSlug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (taskNameInUrl !== taskNameSlug) {
    // Redirect silently to the correct URL
    return {
      status: 302,
      redirect: `/tasks/${shortId}/${taskNameSlug}`
    };
  }

  return {
    task
  };
};
