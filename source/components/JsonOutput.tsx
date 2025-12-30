import React, { useEffect } from "react";
import { useApp } from "ink";

interface JsonOutputProps {
  data: unknown;
  error?: string | null;
}

export const JsonOutput = ({ data, error }: JsonOutputProps) => {
  const { exit } = useApp();

  useEffect(() => {
    if (error) {
      console.log(JSON.stringify({ error }, null, 2));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
    exit();
  }, [data, error, exit]);

  return null;
};
