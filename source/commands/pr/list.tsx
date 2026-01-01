import React from "react";
import { Text } from "ink";
import { Alert } from "@inkjs/ui";
import zod from "zod";
import { argument, option } from "pastel";
import { listPullRequests } from "../../services/bitbucket.js";
import { useApi } from "../../hooks/useApi.js";
import { Layout, LoadingState, Table, JsonOutput } from "../../components/index.js";
import type { PullRequest } from "../../types/api.js";

export const options = zod.object({
  state: zod.string().optional().describe(option({ description: "Filter by state (OPEN, MERGED, DECLINED)", alias: "s" })),
  json: zod.boolean().default(false).describe("Output as JSON for agents"),
});

export const args = zod.tuple([
  zod.string().describe(argument({ name: "workspace", description: "Workspace slug" })),
  zod.string().describe(argument({ name: "repo", description: "Repository slug" })),
]);

type Props = {
  options: zod.infer<typeof options>;
  args: zod.infer<typeof args>;
};

interface PRRow {
  id: number;
  title: string;
  state: string;
  author: string;
}

const columns = [
  { key: "id" as keyof PRRow, header: "ID", width: 6 },
  { key: "title" as keyof PRRow, header: "Title", width: 40 },
  { key: "state" as keyof PRRow, header: "State", width: 10 },
  { key: "author" as keyof PRRow, header: "Author", width: 20 },
];

export default function ListPRs({ options: { state, json }, args: [workspace, repo] }: Props) {
  const { data, loading, error } = useApi(() => listPullRequests(workspace, repo, state));

  if (json) {
    if (loading) return null;
    return <JsonOutput data={data?.values ?? []} error={error} />;
  }

  if (loading) return <LoadingState label={`Fetching pull requests from ${workspace}/${repo}...`} />;

  if (error) return (
    <Layout>
      <Alert variant="error">Error: {error}</Alert>
    </Layout>
  );

  const prs: PRRow[] = (data?.values ?? []).map(pr => ({
    id: pr.id,
    title: pr.title,
    state: pr.state,
    author: pr.author?.display_name || "",
  }));

  return (
    <Layout title={`Pull Requests in ${workspace}/${repo}`}>
      {prs.length === 0 ? (
        <Text dimColor>No pull requests found</Text>
      ) : (
        <Table data={prs} columns={columns} />
      )}
    </Layout>
  );
}
