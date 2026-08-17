import React from "react";
import zod from "zod";
import { jsonOption } from "../../../schemas/command.js";
import { argument, option } from "pastel";
import { addPullRequestComment } from "../../../services/bitbucket.js";
import { MutationOutput } from "../../../components/index.js";

export const options = zod.object({
  content: zod.string().min(1).describe(option({ description: "Comment text", alias: "c" })),
  json: jsonOption,
});
export const args = zod.tuple([
  zod.string().describe(argument({ name: "workspace", description: "Workspace slug" })),
  zod.string().describe(argument({ name: "repo", description: "Repository slug" })),
  zod.coerce.number().int().positive().describe(argument({ name: "id", description: "Pull request ID" })),
]);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };

export default function AddComment({ options: { content, json }, args: [workspace, repo, id] }: Props) {
  return <MutationOutput execute={() => addPullRequestComment(workspace, repo, id, content)} json={json} loadingLabel={`Adding comment to pull request #${id}...`} successMessage={comment => `Comment #${comment.id} added to pull request #${id}`} />;
}
