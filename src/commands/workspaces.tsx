import React from "react";
import { Alert } from "@inkjs/ui";
import zod from "zod";
import { jsonOption } from "../schemas/command.js";
import { listWorkspaces } from "../services/bitbucket.js";
import { useApi } from "../hooks/useApi.js";
import { Layout, LoadingState, Table, JsonOutput } from "../components/index.js";
import type { Workspace } from "../types/api.js";

export const options = zod.object({
  json: jsonOption,
});

type Props = {
  options: zod.infer<typeof options>;
};

const columns = [
  { key: "name" as keyof Workspace, header: "Name", width: 30 },
  { key: "slug" as keyof Workspace, header: "Slug", width: 25 },
  { key: "type" as keyof Workspace, header: "Type", width: 15 },
];

export default function Workspaces({ options: { json } }: Props) {
  const { data, loading, error } = useApi(() => listWorkspaces());

  if (json) {
    if (loading) return null;
    return <JsonOutput data={data?.values ?? []} error={error} />;
  }

  if (loading) return <LoadingState label="Fetching workspaces..." />;

  if (error) return (
    <Layout>
      <Alert variant="error">Error: {error}</Alert>
    </Layout>
  );

  return (
    <Layout title="Workspaces">
      <Table data={data?.values ?? []} columns={columns} />
    </Layout>
  );
}
