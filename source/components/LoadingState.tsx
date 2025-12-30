import React from "react";
import { Box } from "ink";
import { Spinner } from "@inkjs/ui";

interface LoadingStateProps {
  label: string;
}

export const LoadingState = ({ label }: LoadingStateProps) => (
  <Box>
    <Spinner label={label} />
  </Box>
);
