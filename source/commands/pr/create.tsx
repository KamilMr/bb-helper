import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { TextInput, Select, ConfirmInput, Spinner, Alert, StatusMessage } from "@inkjs/ui";
import zod from "zod";
import { option } from "pastel";
import { createPullRequest, listWorkspaces, listRepos } from "../../services/bitbucket.js";
import { useApi } from "../../hooks/useApi.js";
import { Layout, JsonOutput } from "../../components/index.js";
import type { Workspace, Repository, PullRequest } from "../../types/api.js";

export const options = zod.object({
  workspace: zod.string().optional().describe(option({ description: "Workspace slug", alias: "w" })),
  repo: zod.string().optional().describe(option({ description: "Repository slug", alias: "r" })),
  source: zod.string().optional().describe(option({ description: "Source branch", alias: "s" })),
  dest: zod.string().optional().describe(option({ description: "Destination branch", alias: "d" })),
  title: zod.string().optional().describe(option({ description: "PR title", alias: "t" })),
  description: zod.string().optional().describe(option({ description: "PR description" })),
  closeSource: zod.boolean().default(false).describe(option({ description: "Close source branch on merge" })),
  json: zod.boolean().default(false).describe("Output as JSON for agents"),
});

type Props = {
  options: zod.infer<typeof options>;
};

type Step = "workspace" | "repo" | "source" | "dest" | "title" | "confirm" | "creating" | "done";

export default function CreatePR({ options: opts }: Props) {
  const getInitialStep = (): Step => {
    if (!opts.workspace) return "workspace";
    if (!opts.repo) return "repo";
    if (!opts.source) return "source";
    if (!opts.dest) return "dest";
    if (!opts.title) return "title";
    return "confirm";
  };

  const [step, setStep] = useState<Step>(getInitialStep());
  const [workspace, setWorkspace] = useState(opts.workspace || "");
  const [repo, setRepo] = useState(opts.repo || "");
  const [source, setSource] = useState(opts.source || "");
  const [dest, setDest] = useState(opts.dest || "");
  const [title, setTitle] = useState(opts.title || "");
  const [result, setResult] = useState<{ success: boolean; data?: PullRequest; error?: string } | null>(null);

  const { data: workspacesData, loading: loadingWorkspaces } = useApi(() => listWorkspaces());
  const { data: reposData, loading: loadingRepos } = useApi(() =>
    workspace ? listRepos(workspace) : Promise.resolve({ values: [], size: 0, page: 1, pagelen: 0 })
  );

  const handleCreate = async () => {
    setStep("creating");
    try {
      const pr = await createPullRequest({
        workspace,
        repoSlug: repo,
        title,
        sourceBranch: source,
        destinationBranch: dest,
        description: opts.description,
        closeSourceBranch: opts.closeSource,
      });
      setResult({ success: true, data: pr });
    } catch (err) {
      setResult({ success: false, error: (err as Error).message });
    }
    setStep("done");
  };

  useEffect(() => {
    if (opts.json && opts.workspace && opts.repo && opts.source && opts.dest && opts.title && step === "confirm")
      handleCreate();
  }, [opts.json, opts.workspace, opts.repo, opts.source, opts.dest, opts.title, step]);

  if (opts.json) {
    if (step === "done") return <JsonOutput data={result?.data} error={result?.error} />;
    if (!opts.workspace || !opts.repo || !opts.source || !opts.dest || !opts.title)
      return <JsonOutput data={null} error="--workspace, --repo, --source, --dest, and --title required for JSON mode" />;
    return null;
  }

  if (step === "workspace") {
    if (loadingWorkspaces) return <Spinner label="Loading workspaces..." />;
    const items = workspacesData?.values?.map((w: Workspace) => ({ label: w.name, value: w.slug })) || [];
    return (
      <Layout title="Create Pull Request">
        <Text>Select workspace:</Text>
        <Select options={items} onChange={(val) => { setWorkspace(val); setStep("repo"); }} />
      </Layout>
    );
  }

  if (step === "repo") {
    if (loadingRepos) return <Spinner label="Loading repositories..." />;
    const items = reposData?.values?.map((r: Repository) => ({ label: r.name, value: r.slug })) || [];
    return (
      <Layout title="Create Pull Request">
        <Text>Select repository:</Text>
        <Select options={items} onChange={(val) => { setRepo(val); setStep("source"); }} />
      </Layout>
    );
  }

  if (step === "source") {
    return (
      <Layout title="Create Pull Request">
        <Box flexDirection="column" gap={1}>
          <Text>Source branch:</Text>
          <TextInput placeholder="feature-branch" onSubmit={(val) => { setSource(val); setStep("dest"); }} />
        </Box>
      </Layout>
    );
  }

  if (step === "dest") {
    return (
      <Layout title="Create Pull Request">
        <Box flexDirection="column" gap={1}>
          <Text>Destination branch:</Text>
          <TextInput placeholder="main" onSubmit={(val) => { setDest(val); setStep("title"); }} />
        </Box>
      </Layout>
    );
  }

  if (step === "title") {
    return (
      <Layout title="Create Pull Request">
        <Box flexDirection="column" gap={1}>
          <Text>PR title:</Text>
          <TextInput placeholder="Add feature X" onSubmit={(val) => { setTitle(val); setStep("confirm"); }} />
        </Box>
      </Layout>
    );
  }

  if (step === "confirm") {
    return (
      <Layout title="Confirm Pull Request">
        <Box flexDirection="column" gap={1}>
          <Text><Text bold>Workspace:</Text> {workspace}</Text>
          <Text><Text bold>Repository:</Text> {repo}</Text>
          <Text><Text bold>Source:</Text> {source}</Text>
          <Text><Text bold>Destination:</Text> {dest}</Text>
          <Text><Text bold>Title:</Text> {title}</Text>
          {opts.description && <Text><Text bold>Description:</Text> {opts.description}</Text>}
          <Text><Text bold>Close source branch:</Text> {opts.closeSource ? "Yes" : "No"}</Text>
          <Box marginTop={1}>
            <Text>Create this pull request? </Text>
            <ConfirmInput onConfirm={handleCreate} onCancel={() => setStep("title")} />
          </Box>
        </Box>
      </Layout>
    );
  }

  if (step === "creating") return <Spinner label="Creating pull request..." />;

  return (
    <Layout>
      {result?.success
        ? <StatusMessage variant="success">Pull request created: {result.data?.links.html.href}</StatusMessage>
        : <Alert variant="error">{result?.error}</Alert>
      }
    </Layout>
  );
}
