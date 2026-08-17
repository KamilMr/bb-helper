import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { TextInput, Select, ConfirmInput, Spinner, Alert, StatusMessage } from "@inkjs/ui";
import zod from "zod";
import { jsonOption } from "../../schemas/command.js";
import { option } from "pastel";
import { createRepo, listWorkspaces } from "../../services/bitbucket.js";
import { useApi } from "../../hooks/useApi.js";
import { Layout, JsonOutput } from "../../components/index.js";
import type { Workspace, Repository } from "../../types/api.js";

export const options = zod.object({
  workspace: zod.string().optional().describe(option({ description: "Workspace slug", alias: "w" })),
  name: zod.string().optional().describe(option({ description: "Repository name", alias: "n" })),
  project: zod.string().optional().describe(option({ description: "Project key", alias: "p" })),
  private: zod.boolean().default(true).describe(option({ description: "Make repository private" })),
  json: jsonOption,
});

type Props = {
  options: zod.infer<typeof options>;
};

type Step = "workspace" | "name" | "project" | "confirm" | "creating" | "done";

export default function CreateRepo({ options: opts }: Props) {
  const [step, setStep] = useState<Step>(opts.workspace ? (opts.name ? "confirm" : "name") : "workspace");
  const [workspace, setWorkspace] = useState(opts.workspace || "");
  const [name, setName] = useState(opts.name || "");
  const [project, setProject] = useState(opts.project || "");
  const [result, setResult] = useState<{ success: boolean; data?: Repository; error?: string } | null>(null);

  const { data: workspacesData, loading: loadingWorkspaces } = useApi(() => listWorkspaces());

  const handleCreate = async () => {
    setStep("creating");
    try {
      const repo = await createRepo({ workspace, slug: name, projectKey: project || undefined, isPrivate: opts.private });
      setResult({ success: true, data: repo });
    } catch (err) {
      setResult({ success: false, error: (err as Error).message });
    }
    setStep("done");
  };

  // Auto-create in JSON mode when all args provided
  useEffect(() => {
    if (opts.json && opts.workspace && opts.name && step === "confirm") {
      handleCreate();
    }
  }, [opts.json, opts.workspace, opts.name, step]);

  if (opts.json) {
    if (step === "done") return <JsonOutput data={result?.data} error={result?.error} />;
    if (!opts.workspace || !opts.name) {
      return <JsonOutput data={null} error="--workspace and --name required for JSON mode" />;
    }
    return null; // Wait for useEffect to trigger
  }

  if (step === "workspace") {
    if (loadingWorkspaces) return <Spinner label="Loading workspaces..." />;
    const items = workspacesData?.values?.map((w: Workspace) => ({ label: w.name, value: w.slug })) || [];
    return (
      <Layout title="Create Repository">
        <Text>Select workspace:</Text>
        <Select options={items} onChange={(val) => { setWorkspace(val); setStep("name"); }} />
      </Layout>
    );
  }

  if (step === "name") {
    return (
      <Layout title="Create Repository">
        <Box flexDirection="column" gap={1}>
          <Text>Repository name:</Text>
          <TextInput placeholder="my-repo" onSubmit={(val) => { setName(val); setStep("project"); }} />
        </Box>
      </Layout>
    );
  }

  if (step === "project") {
    return (
      <Layout title="Create Repository">
        <Box flexDirection="column" gap={1}>
          <Text>Project key (optional, press Enter to skip):</Text>
          <TextInput placeholder="" onSubmit={(val) => { setProject(val); setStep("confirm"); }} />
        </Box>
      </Layout>
    );
  }

  if (step === "confirm") {
    return (
      <Layout title="Confirm Repository Creation">
        <Box flexDirection="column" gap={1}>
          <Text><Text bold>Workspace:</Text> {workspace}</Text>
          <Text><Text bold>Name:</Text> {name}</Text>
          {project && <Text><Text bold>Project:</Text> {project}</Text>}
          <Text><Text bold>Private:</Text> {opts.private ? "Yes" : "No"}</Text>
          <Box marginTop={1}>
            <Text>Create this repository? </Text>
            <ConfirmInput onConfirm={handleCreate} onCancel={() => setStep("name")} />
          </Box>
        </Box>
      </Layout>
    );
  }

  if (step === "creating") return <Spinner label="Creating repository..." />;

  return (
    <Layout>
      {result?.success
        ? <StatusMessage variant="success">Repository "{name}" created successfully!</StatusMessage>
        : <Alert variant="error">{result?.error}</Alert>
      }
    </Layout>
  );
}
