import React from "react";
import { Box, Text } from "ink";
import { Alert } from "@inkjs/ui";
import zod from "zod";
import { getUser } from "../services/bitbucket.js";
import { useApi } from "../hooks/useApi.js";
import { Layout, LoadingState, JsonOutput } from "../components/index.js";

export const options = zod.object({
  json: zod.boolean().default(false).describe("Output as JSON for agents"),
});

type Props = {
  options: zod.infer<typeof options>;
};

export default function Me({ options: { json } }: Props) {
  const { data, loading, error } = useApi(() => getUser());

  if (json) {
    if (loading) return null;
    return <JsonOutput data={data} error={error} />;
  }

  if (loading) return <LoadingState label="Fetching user info..." />;

  if (error) return (
    <Layout>
      <Alert variant="error">Error: {error}</Alert>
    </Layout>
  );

  return (
    <Layout title="User Information">
      <Box flexDirection="column" gap={1}>
        <Text><Text bold>Username:</Text> {data?.username}</Text>
        <Text><Text bold>Display Name:</Text> {data?.display_name}</Text>
        <Text><Text bold>Account ID:</Text> {data?.account_id}</Text>
        <Text><Text bold>UUID:</Text> {data?.uuid}</Text>
      </Box>
    </Layout>
  );
}
