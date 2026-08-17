import zod from "zod";
import { argument } from "pastel";

export const jsonOption = zod.boolean().default(false).describe("Output as JSON for agents");

export const workspaceArgument = zod.string().describe(
  argument({ name: "workspace", description: "Workspace slug" }),
);

export const repositoryArgument = zod.string().describe(
  argument({ name: "repo", description: "Repository slug" }),
);

export const pullRequestIdArgument = zod.coerce.number().int().positive().describe(
  argument({ name: "id", description: "Pull request ID" }),
);

export const workspaceArguments = [workspaceArgument] as const;
export const repositoryArguments = [...workspaceArguments, repositoryArgument] as const;
export const pullRequestArguments = [...repositoryArguments, pullRequestIdArgument] as const;
