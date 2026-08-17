import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Alert, Spinner, TextInput } from "@inkjs/ui";
import zod from "zod";
import { option } from "pastel";
import { jsonOption, pullRequestArguments } from "../../schemas/command.js";
import {
  getMergeConfirmationError,
  getPullRequest,
  mergePullRequest,
} from "../../services/bitbucket.js";
import { JsonOutput, Layout, MutationOutput } from "../../components/index.js";
import { useApi } from "../../hooks/useApi.js";

export const options = zod.object({
  strategy: zod.string().optional().describe(option({ description: "Merge strategy (merge_commit, squash, fast_forward)" })),
  message: zod.string().optional().describe(option({ description: "Merge commit message", alias: "m" })),
  closeSource: zod.boolean().optional().describe(option({ description: "Close the source branch" })),
  confirmId: zod.string().optional().describe(option({ description: "Confirm by repeating the PR ID (required for JSON/non-interactive use)" })),
  json: jsonOption,
});
export const args = zod.tuple(pullRequestArguments);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };
type MergeOptions = Omit<Props["options"], "confirmId" | "json">;

export const shouldPromptForMergeConfirmation = (json: boolean, isTTY: boolean) =>
  !json && isTTY;

type MergeTarget = {
  workspace: string;
  repo: string;
  id: number;
  mergeOptions: MergeOptions;
};

const MergeFailure = ({ error, json }: { error: string; json: boolean }) => {
  useEffect(() => {
    process.exitCode = 1;
  }, []);

  return json
    ? <JsonOutput data={null} error={error} />
    : <Layout><Alert variant="error">{error}</Alert></Layout>;
};

const ConfirmedMerge = ({
  workspace,
  repo,
  id,
  mergeOptions: { strategy, message, closeSource },
  confirmation,
  json,
}: MergeTarget & { confirmation: string; json: boolean }) => (
  <MutationOutput
    execute={() => mergePullRequest({
      workspace,
      repoSlug: repo,
      pullRequestId: id,
      confirmation,
      strategy,
      message,
      closeSourceBranch: closeSource ? true : undefined,
    })}
    json={json}
    loadingLabel={`Merging pull request #${id}...`}
    successMessage={`Pull request #${id} merged`}
  />
);

const InteractiveMerge = ({ workspace, repo, id, mergeOptions }: MergeTarget) => {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const { data, loading, error } = useApi(() => getPullRequest(workspace, repo, id));

  if (confirmationError) return <MergeFailure error={confirmationError} json={false} />;
  if (confirmation !== null) {
    return (
      <ConfirmedMerge
        workspace={workspace}
        repo={repo}
        id={id}
        mergeOptions={mergeOptions}
        confirmation={confirmation}
        json={false}
      />
    );
  }
  if (loading) return <Spinner label={`Fetching pull request #${id}...`} />;
  if (error) return <MergeFailure error={error} json={false} />;

  const handleConfirmation = (value: string) => {
    const validationError = getMergeConfirmationError(id, value);
    if (validationError) {
      setConfirmationError(validationError);
    } else {
      setConfirmation(value);
    }
  };

  return (
    <Layout title={`Confirm Merge of Pull Request #${id}`}>
      <Box flexDirection="column" gap={1}>
        <Alert variant="warning">This will merge the following pull request:</Alert>
        <Text><Text bold>Title:</Text> {data?.title}</Text>
        <Text><Text bold>Author:</Text> {data?.author.display_name}</Text>
        <Text><Text bold>State:</Text> {data?.state}{data?.draft ? " (draft)" : ""}</Text>
        <Text><Text bold>Branches:</Text> {data?.source.branch.name} → {data?.destination.branch.name}</Text>
        <Text><Text bold>URL:</Text> {data?.links.html.href}</Text>
        <Text>Type <Text bold>{id}</Text> to merge, or submit an empty value to cancel:</Text>
        <TextInput placeholder="Pull request ID" onSubmit={handleConfirmation} />
      </Box>
    </Layout>
  );
};

export default function MergePR({ options: { confirmId, json, ...mergeOptions }, args: [workspace, repo, id] }: Props) {
  const target = { workspace, repo, id, mergeOptions };

  if (shouldPromptForMergeConfirmation(json, process.stdin.isTTY === true)) {
    return <InteractiveMerge {...target} />;
  }

  if (confirmId === undefined) {
    return <MergeFailure error={getMergeConfirmationError(id) as string} json={json} />;
  }

  const confirmationError = getMergeConfirmationError(id, confirmId);
  if (confirmationError) return <MergeFailure error={confirmationError} json={json} />;
  return <ConfirmedMerge {...target} confirmation={confirmId} json={json} />;
}
