import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { TextInput, Select, ConfirmInput, Spinner, Alert, StatusMessage } from "@inkjs/ui";
import zod from "zod";
import { option } from "pastel";
import { createPullRequest, listRepos } from "../../services/bitbucket.js";
import { Layout, JsonOutput } from "../../components/index.js";
import type { Repository, PullRequest } from "../../types/api.js";

export const options = zod.object({
  workspace: zod.string().optional().describe(option({ description: "Workspace slug", alias: "w" })),
  repo: zod.string().optional().describe(option({ description: "Repository slug", alias: "r" })),
  source: zod.string().optional().describe(option({ description: "Source branch", alias: "s" })),
  dest: zod.string().optional().describe(option({ description: "Destination branch", alias: "d" })),
  title: zod.string().optional().describe(option({ description: "PR title", alias: "t" })),
  description: zod.string().optional().describe(option({ description: "PR description" })),
  reviewers: zod.string().optional().describe(option({ description: "Comma-separated reviewer UUIDs" })),
  closeSource: zod.boolean().default(false).describe(option({ description: "Close source branch on merge" })),
  draft: zod.boolean().default(false).describe(option({ description: "Create as draft" })),
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
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    if (step === "repo" && workspace) {
      setLoadingRepos(true);
      listRepos(workspace)
        .then(data => { setRepos(data.values); setLoadingRepos(false); })
        .catch(() => setLoadingRepos(false));
    }
  }, [step, workspace]);

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
        reviewers: opts.reviewers?.split(",").map(value => value.trim()).filter(Boolean),
        closeSourceBranch: opts.closeSource,
        draft: opts.draft,
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
    return (
      <Layout title="Create Pull Request">
        <Box flexDirection="column" gap={1}>
          <Text>Workspace slug:</Text>
          <TextInput placeholder="my-workspace" onSubmit={(val) => { setWorkspace(val); setStep("repo"); }} />
        </Box>
      </Layout>
    );
  }

  if (step === "repo") {
    if (loadingRepos) return <Spinner label="Loading repositories..." />;
    const items = repos.map((r: Repository) => ({ label: r.name, value: r.slug }));
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
          {opts.reviewers && <Text><Text bold>Reviewer UUIDs:</Text> {opts.reviewers}</Text>}
          <Text><Text bold>Draft:</Text> {opts.draft ? "Yes" : "No"}</Text>
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

  const prUrl = result?.data?.links?.html?.href;
  return (
    <Layout>
      {result?.success
        ? <StatusMessage variant="success">Pull request #{result.data?.id} created{prUrl ? `: ${prUrl}` : ""}</StatusMessage>
        : <Alert variant="error">{result?.error}</Alert>
      }
    </Layout>
  );
}
