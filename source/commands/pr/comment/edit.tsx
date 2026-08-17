import React from "react";
import zod from "zod";
import { argument, option } from "pastel";
import { jsonOption, pullRequestArguments } from "../../../schemas/command.js";
import { editPullRequestComment } from "../../../services/bitbucket.js";
import { MutationOutput } from "../../../components/index.js";

export const options = zod.object({
  content: zod.string().min(1).describe(option({ description: "Replacement comment text", alias: "c" })),
  json: jsonOption,
});
export const args = zod.tuple([
  ...pullRequestArguments,
  zod.coerce.number().int().positive().describe(argument({ name: "comment-id", description: "Comment ID" })),
]);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };

export default function EditComment({ options: { content, json }, args: [workspace, repo, id, commentId] }: Props) {
  return <MutationOutput execute={() => editPullRequestComment(workspace, repo, id, commentId, content)} json={json} loadingLabel={`Editing comment #${commentId}...`} successMessage={`Comment #${commentId} updated`} />;
}
