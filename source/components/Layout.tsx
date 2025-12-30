import React from "react";
import { Box, Text } from "ink";

interface LayoutProps {
  title?: string;
  children: React.ReactNode;
}

export const Layout = ({ title, children }: LayoutProps) => (
  <Box flexDirection="column" padding={1}>
    {title && (
      <Box marginBottom={1}>
        <Text bold color="blue">{title}</Text>
      </Box>
    )}
    {children}
  </Box>
);
