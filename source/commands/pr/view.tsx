import React from "react";
import { Box, Text } from "ink";
import { Alert } from "@inkjs/ui";
import zod from "zod";
import { argument } from "pastel";
import { getPullRequest } from "../../services/bitbucket.js";
import { useApi } from "../../hooks/useApi.js";
import { JsonOutput, Layout, LoadingState } from "../../components/index.js";

export const options = zod.object({
  json: zod.boolean().default(false).describe("Output as JSON for agents"),
});

export const args = zod.tuple([
  zod.string().describe(argument({ name: "workspace", description: "Workspace slug" })),
  zod.string().describe(argument({ name: "repo", description: "Repository slug" })),
  zod.coerce.number().int().positive().describe(argument({ name: "id", description: "Pull request ID" })),
]);

type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };

export default function ViewPR({ options: { json }, args: [workspace, repo, id] }: Props) {
  const { data, loading, error } = useApi(() => getPullRequest(workspace, repo, id));

  if (json) {
    if (loading) return null;
    return <JsonOutput data={data} error={error} />;
  }
  if (loading) return <LoadingState label={`Fetching pull request #${id}...`} />;
  if (error) return <Layout><Alert variant="error">{error}</Alert></Layout>;

  return (
    <Layout title={`Pull Request #${id}`}>
      <Box flexDirection="column">
        <Text><Text bold>Title:</Text> {data?.title}</Text>
        <Text><Text bold>State:</Text> {data?.state}{data?.draft ? " (draft)" : ""}</Text>
        <Text><Text bold>Author:</Text> {data?.author.display_name}</Text>
        <Text><Text bold>Branches:</Text> {data?.source.branch.name} → {data?.destination.branch.name}</Text>
        <Text><Text bold>Reviewers:</Text> {data?.reviewers.map(user => user.display_name).join(", ") || "None"}</Text>
        <Text><Text bold>URL:</Text> {data?.links.html.href}</Text>
      </Box>
    </Layout>
  );
}
