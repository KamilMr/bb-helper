import React from "react";
import zod from "zod";
import { jsonOption, pullRequestArguments } from "../../schemas/command.js";
import { declinePullRequest } from "../../services/bitbucket.js";
import { MutationOutput } from "../../components/index.js";

export const options = zod.object({ json: jsonOption });
export const args = zod.tuple(pullRequestArguments);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };

export default function DeclinePR({ options: { json }, args: [workspace, repo, id] }: Props) {
  return <MutationOutput execute={() => declinePullRequest(workspace, repo, id)} json={json} loadingLabel={`Declining pull request #${id}...`} successMessage={`Pull request #${id} declined`} />;
}
