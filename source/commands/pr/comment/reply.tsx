import React from "react";
import zod from "zod";
import { argument, option } from "pastel";
import { addPullRequestComment } from "../../../services/bitbucket.js";
import { MutationOutput } from "../../../components/index.js";

export const options = zod.object({
  content: zod.string().min(1).describe(option({ description: "Reply text", alias: "c" })),
  json: zod.boolean().default(false).describe("Output as JSON for agents"),
});
export const args = zod.tuple([
  zod.string().describe(argument({ name: "workspace", description: "Workspace slug" })),
  zod.string().describe(argument({ name: "repo", description: "Repository slug" })),
  zod.coerce.number().int().positive().describe(argument({ name: "id", description: "Pull request ID" })),
  zod.coerce.number().int().positive().describe(argument({ name: "parent-id", description: "Parent comment ID" })),
]);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };

export default function ReplyComment({ options: { content, json }, args: [workspace, repo, id, parentId] }: Props) {
  return <MutationOutput execute={() => addPullRequestComment(workspace, repo, id, content, parentId)} json={json} loadingLabel={`Replying to comment #${parentId}...`} successMessage={comment => `Reply #${comment.id} added`} />;
}
