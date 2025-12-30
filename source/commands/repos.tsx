import React from "react";
import { Text } from "ink";
import { Alert } from "@inkjs/ui";
import zod from "zod";
import { argument } from "pastel";
import { listRepos } from "../services/bitbucket.js";
import { useApi } from "../hooks/useApi.js";
import { Layout, LoadingState, Table, JsonOutput } from "../components/index.js";
import type { Repository } from "../types/api.js";

export const options = zod.object({
  json: zod.boolean().default(false).describe("Output as JSON for agents"),
});

export const args = zod.tuple([
  zod.string().describe(argument({ name: "workspace", description: "Workspace slug" })),
]);

type Props = {
  options: zod.infer<typeof options>;
  args: zod.infer<typeof args>;
};

const columns = [
  { key: "name" as keyof Repository, header: "Name", width: 30 },
  { key: "slug" as keyof Repository, header: "Slug", width: 25 },
  { key: "is_private" as keyof Repository, header: "Private", width: 10 },
];

export default function Repos({ options: { json }, args: [workspace] }: Props) {
  const { data, loading, error } = useApi(() => listRepos(workspace));

  if (json) {
    if (loading) return null;
    return <JsonOutput data={data?.values ?? []} error={error} />;
  }

  if (loading) return <LoadingState label={`Fetching repos from ${workspace}...`} />;

  if (error) return (
    <Layout>
      <Alert variant="error">Error: {error}</Alert>
    </Layout>
  );

  const repos = data?.values ?? [];

  return (
    <Layout title={`Repositories in ${workspace}`}>
      {repos.length === 0 ? (
        <Text dimColor>No repositories found</Text>
      ) : (
        <Table data={repos} columns={columns} />
      )}
    </Layout>
  );
}
