import React, { useEffect, useRef, useState } from "react";
import { Alert, Spinner, StatusMessage } from "@inkjs/ui";
import { JsonOutput } from "./JsonOutput.js";
import { Layout } from "./Layout.js";

type MutationState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

interface MutationOutputProps<T> {
  execute: () => Promise<T>;
  json: boolean;
  loadingLabel: string;
  successMessage: string | ((data: T) => string);
}

export const MutationOutput = <T,>({
  execute,
  json,
  loadingLabel,
  successMessage,
}: MutationOutputProps<T>) => {
  const executeRef = useRef(execute);
  const startedRef = useRef(false);
  const [state, setState] = useState<MutationState<T>>({ status: "loading" });

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    executeRef.current()
      .then(data => setState({ status: "success", data }))
      .catch(error => {
        setState({ status: "error", error: (error as Error).message });
      });
  }, []);

  if (state.status === "loading") {
    return json ? null : <Spinner label={loadingLabel} />;
  }

  if (state.status === "error") {
    return json ? (
      <JsonOutput data={null} error={state.error} />
    ) : (
      <Layout><Alert variant="error">{state.error}</Alert></Layout>
    );
  }

  if (json) return <JsonOutput data={state.data} />;

  const message = typeof successMessage === "function"
    ? successMessage(state.data)
    : successMessage;

  return (
    <Layout>
      <StatusMessage variant="success">{message}</StatusMessage>
    </Layout>
  );
};
