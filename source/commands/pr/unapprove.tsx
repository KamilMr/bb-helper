import React from "react";
import zod from "zod";
import { argument } from "pastel";
import { unapprovePullRequest } from "../../services/bitbucket.js";
import { MutationOutput } from "../../components/index.js";

export const options = zod.object({ json: zod.boolean().default(false).describe("Output as JSON for agents") });
export const args = zod.tuple([
  zod.string().describe(argument({ name: "workspace", description: "Workspace slug" })),
  zod.string().describe(argument({ name: "repo", description: "Repository slug" })),
  zod.coerce.number().int().positive().describe(argument({ name: "id", description: "Pull request ID" })),
]);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };

export default function UnapprovePR({ options: { json }, args: [workspace, repo, id] }: Props) {
  const execute = async () => {
    await unapprovePullRequest(workspace, repo, id);
    return { unapproved: true, workspace, repo, pull_request_id: id };
  };
  return <MutationOutput execute={execute} json={json} loadingLabel={`Removing approval from pull request #${id}...`} successMessage={`Approval removed from pull request #${id}`} />;
}
