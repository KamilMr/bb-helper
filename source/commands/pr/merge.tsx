import React from "react";
import zod from "zod";
import { argument, option } from "pastel";
import { mergePullRequest } from "../../services/bitbucket.js";
import { MutationOutput } from "../../components/index.js";

export const options = zod.object({
  strategy: zod.string().optional().describe(option({ description: "Merge strategy (merge_commit, squash, fast_forward)" })),
  message: zod.string().optional().describe(option({ description: "Merge commit message", alias: "m" })),
  closeSource: zod.boolean().optional().describe(option({ description: "Close the source branch" })),
  json: zod.boolean().default(false).describe("Output as JSON for agents"),
});
export const args = zod.tuple([
  zod.string().describe(argument({ name: "workspace", description: "Workspace slug" })),
  zod.string().describe(argument({ name: "repo", description: "Repository slug" })),
  zod.coerce.number().int().positive().describe(argument({ name: "id", description: "Pull request ID" })),
]);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };

export default function MergePR({ options: { strategy, message, closeSource, json }, args: [workspace, repo, id] }: Props) {
  return (
    <MutationOutput
      execute={() => mergePullRequest({ workspace, repoSlug: repo, pullRequestId: id, strategy, message, closeSourceBranch: closeSource ? true : undefined })}
      json={json}
      loadingLabel={`Merging pull request #${id}...`}
      successMessage={`Pull request #${id} merged`}
    />
  );
}
