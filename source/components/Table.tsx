import React from "react";
import { Box, Text } from "ink";

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
}

export function Table<T extends object>({ data, columns }: TableProps<T>) {
  return (
    <Box flexDirection="column">
      <Box>
        {columns.map(col => (
          <Box key={String(col.key)} width={col.width || 20}>
            <Text bold color="cyan">{col.header}</Text>
          </Box>
        ))}
      </Box>
      {data.map((row, i) => (
        <Box key={i}>
          {columns.map(col => (
            <Box key={String(col.key)} width={col.width || 20}>
              <Text>{String((row as Record<string, unknown>)[col.key as string] ?? "")}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
