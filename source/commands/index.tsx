import React from "react";
import { Box, Text } from "ink";

export const description = "Bitbucket CLI - manage repositories, workspaces, and projects";

export default function Index() {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="blue">Bitbucket CLI</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>Available commands:</Text>
        <Text>  <Text color="cyan">me</Text>          - Show current user info</Text>
        <Text>  <Text color="cyan">workspaces</Text>  - List all workspaces</Text>
        <Text>  <Text color="cyan">repos</Text>       - List repositories in a workspace</Text>
        <Text>  <Text color="cyan">repo create</Text> - Create a new repository</Text>
        <Text>  <Text color="cyan">repo delete</Text> - Delete a repository</Text>
        <Text>  <Text color="cyan">project create</Text> - Create a new project</Text>
        <Text>  <Text color="cyan">pr</Text>          - Create, review, merge, and comment on pull requests</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Use --json flag with any command for agent-friendly output</Text>
      </Box>
    </Box>
  );
}
