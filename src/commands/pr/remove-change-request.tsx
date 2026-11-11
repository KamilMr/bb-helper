import React from "react";
import zod from "zod";
import { jsonOption, pullRequestArguments } from "../../schemas/command.js";
import { removePullRequestChangeRequest } from "../../services/bitbucket.js";
import { MutationOutput } from "../../components/index.js";

export const options = zod.object({ json: jsonOption });
export const args = zod.tuple(pullRequestArguments);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };

export default function RemoveChangeRequest({ options: { json }, args: [workspace, repo, id] }: Props) {
  const execute = async () => {
    await removePullRequestChangeRequest(workspace, repo, id);
    return { changes_requested: false, workspace, repo, pull_request_id: id };
  };
  return <MutationOutput execute={execute} json={json} loadingLabel={`Removing change request from pull request #${id}...`} successMessage={`Change request removed from pull request #${id}`} />;
}
