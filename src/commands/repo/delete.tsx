import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";
import { ConfirmInput, Spinner, Alert, StatusMessage } from "@inkjs/ui";
import zod from "zod";
import { argument } from "pastel";
import { jsonOption, workspaceArgument } from "../../schemas/command.js";
import { deleteRepo } from "../../services/bitbucket.js";
import { Layout, JsonOutput } from "../../components/index.js";

export const options = zod.object({
  json: jsonOption,
  force: zod.boolean().default(false).describe("Skip confirmation prompt"),
});

export const args = zod.tuple([
  workspaceArgument,
  zod.string().describe(argument({ name: "slug", description: "Repository slug" })),
]);

type Props = {
  options: zod.infer<typeof options>;
  args: zod.infer<typeof args>;
};

type Step = "confirm" | "deleting" | "done";

export default function DeleteRepo({ options: { json, force }, args: [workspace, slug] }: Props) {
  const [step, setStep] = useState<Step>("confirm");
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleDelete = async () => {
    setStep("deleting");
    try {
      await deleteRepo(workspace, slug);
      setResult({ success: true });
    } catch (err) {
      setResult({ success: false, error: (err as Error).message });
    }
    setStep("done");
  };

  // Auto-delete when force flag is set
  useEffect(() => {
    if (force && step === "confirm") {
      handleDelete();
    }
  }, [force, step]);

  if (json) {
    if (step === "done") return <JsonOutput data={{ deleted: result?.success, workspace, slug }} error={result?.error} />;
    if (step === "deleting") return null;
    return null; // Wait for useEffect
  }

  if (step === "deleting") return <Spinner label="Deleting repository..." />;

  if (step === "confirm") {
    return (
      <Layout title="Delete Repository">
        <Box flexDirection="column" gap={1}>
          <Alert variant="warning">
            You are about to delete repository "{workspace}/{slug}"
          </Alert>
          <Text>This action cannot be undone. Are you sure?</Text>
          <Box marginTop={1}>
            <ConfirmInput onConfirm={handleDelete} onCancel={() => process.exit(0)} />
          </Box>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      {result?.success
        ? <StatusMessage variant="success">Repository "{slug}" deleted successfully!</StatusMessage>
        : <Alert variant="error">{result?.error}</Alert>
      }
    </Layout>
  );
}
