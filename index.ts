import { createRepo, getUser, listWorkspaces, listRepos, deleteRepo } from "./helpers/bb";

const [,, command, ...args] = process.argv;

const commands: Record<string, () => Promise<void>> = {
  "me": async () => {
    const result = await getUser();
    console.log(result);
  },
  "create-repo": async () => {
    const [workspace, slug, projectKey] = args;
    if (!workspace || !slug) {
      console.log("Usage: create-repo <workspace> <slug> [projectKey]");
      return;
    }
    const result = await createRepo({ workspace, slug, projectKey });
    console.log(result);
  },
  "workspaces": async () => {
    const result = await listWorkspaces();
    console.log(result);
  },
  "repos": async () => {
    const [workspace] = args;
    if (!workspace) {
      console.log("Usage: repos <workspace>");
      return;
    }
    const result = await listRepos(workspace);
    console.log(result);
  },
  "delete-repo": async () => {
    const [workspace, slug] = args;
    if (!workspace || !slug) {
      console.log("Usage: delete-repo <workspace> <slug>");
      return;
    }
    const result = await deleteRepo(workspace, slug);
    console.log(result || "Deleted");
  },
};

const run = async () => {
  const handler = commands[command];
  if (!handler) {
    console.log("Available commands:", Object.keys(commands).join(", "));
    return;
  }
  await handler();
};

run();
