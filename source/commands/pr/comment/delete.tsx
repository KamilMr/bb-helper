import React from "react";
import zod from "zod";
import { argument } from "pastel";
import { jsonOption, pullRequestArguments } from "../../../schemas/command.js";
import { deletePullRequestComment } from "../../../services/bitbucket.js";
import { MutationOutput } from "../../../components/index.js";

export const options = zod.object({ json: jsonOption });
export const args = zod.tuple([
  ...pullRequestArguments,
  zod.coerce.number().int().positive().describe(argument({ name: "comment-id", description: "Comment ID" })),
]);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };

export default function DeleteComment({ options: { json }, args: [workspace, repo, id, commentId] }: Props) {
  const execute = async () => {
    await deletePullRequestComment(workspace, repo, id, commentId);
    return { deleted: true, workspace, repo, pull_request_id: id, comment_id: commentId };
  };
  return <MutationOutput execute={execute} json={json} loadingLabel={`Deleting comment #${commentId}...`} successMessage={`Comment #${commentId} deleted`} />;
}
