import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { TextInput, Select, ConfirmInput, Spinner, Alert, StatusMessage } from "@inkjs/ui";
import zod from "zod";
import { option } from "pastel";
import { createProject, listWorkspaces } from "../../services/bitbucket.js";
import { useApi } from "../../hooks/useApi.js";
import { Layout, JsonOutput } from "../../components/index.js";
import type { Workspace, Project } from "../../types/api.js";

export const options = zod.object({
  workspace: zod.string().optional().describe(option({ description: "Workspace slug", alias: "w" })),
  name: zod.string().optional().describe(option({ description: "Project name", alias: "n" })),
  key: zod.string().optional().describe(option({ description: "Project key", alias: "k" })),
  private: zod.boolean().default(true).describe(option({ description: "Make project private" })),
  json: zod.boolean().default(false).describe("Output as JSON for agents"),
});

type Props = {
  options: zod.infer<typeof options>;
};

type Step = "workspace" | "name" | "key" | "confirm" | "creating" | "done";

export default function CreateProject({ options: opts }: Props) {
  const hasAllArgs = opts.workspace && opts.name && opts.key;
  const [step, setStep] = useState<Step>(opts.workspace ? (opts.name ? (opts.key ? "confirm" : "key") : "name") : "workspace");
  const [workspace, setWorkspace] = useState(opts.workspace || "");
  const [name, setName] = useState(opts.name || "");
  const [key, setKey] = useState(opts.key || "");
  const [result, setResult] = useState<{ success: boolean; data?: Project; error?: string } | null>(null);

  const { data: workspacesData, loading: loadingWorkspaces } = useApi(() => listWorkspaces());

  const handleCreate = async () => {
    setStep("creating");
    try {
      const project = await createProject({ workspace, name, key, isPrivate: opts.private });
      setResult({ success: true, data: project });
    } catch (err) {
      setResult({ success: false, error: (err as Error).message });
    }
    setStep("done");
  };

  // Auto-create in JSON mode when all args provided
  useEffect(() => {
    if (opts.json && hasAllArgs && step === "confirm") {
      handleCreate();
    }
  }, [opts.json, hasAllArgs, step]);

  if (opts.json) {
    if (step === "done") return <JsonOutput data={result?.data} error={result?.error} />;
    if (!hasAllArgs) {
      return <JsonOutput data={null} error="--workspace, --name, and --key required for JSON mode" />;
    }
    return null; // Wait for useEffect
  }

  if (step === "workspace") {
    if (loadingWorkspaces) return <Spinner label="Loading workspaces..." />;
    const items = workspacesData?.values?.map((w: Workspace) => ({ label: w.name, value: w.slug })) || [];
    return (
      <Layout title="Create Project">
        <Text>Select workspace:</Text>
        <Select options={items} onChange={(val) => { setWorkspace(val); setStep("name"); }} />
      </Layout>
    );
  }

  if (step === "name") {
    return (
      <Layout title="Create Project">
        <Box flexDirection="column" gap={1}>
          <Text>Project name:</Text>
          <TextInput placeholder="My Project" onSubmit={(val) => { setName(val); setStep("key"); }} />
        </Box>
      </Layout>
    );
  }

  if (step === "key") {
    return (
      <Layout title="Create Project">
        <Box flexDirection="column" gap={1}>
          <Text>Project key (uppercase, e.g., PROJ):</Text>
          <TextInput placeholder="PROJ" onSubmit={(val) => { setKey(val.toUpperCase()); setStep("confirm"); }} />
        </Box>
      </Layout>
    );
  }

  if (step === "confirm") {
    return (
      <Layout title="Confirm Project Creation">
        <Box flexDirection="column" gap={1}>
          <Text><Text bold>Workspace:</Text> {workspace}</Text>
          <Text><Text bold>Name:</Text> {name}</Text>
          <Text><Text bold>Key:</Text> {key}</Text>
          <Text><Text bold>Private:</Text> {opts.private ? "Yes" : "No"}</Text>
          <Box marginTop={1}>
            <Text>Create this project? </Text>
            <ConfirmInput onConfirm={handleCreate} onCancel={() => setStep("name")} />
          </Box>
        </Box>
      </Layout>
    );
  }

  if (step === "creating") return <Spinner label="Creating project..." />;

  return (
    <Layout>
      {result?.success
        ? <StatusMessage variant="success">Project "{name}" ({key}) created successfully!</StatusMessage>
        : <Alert variant="error">{result?.error}</Alert>
      }
    </Layout>
  );
}
