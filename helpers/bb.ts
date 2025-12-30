import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const BASE_URL = "https://api.bitbucket.org/2.0";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: Record<string, unknown>;
}

const getAuth = () => {
  const email = process.env.BB_EMAIL;
  const token = process.env.BB_TOKEN;
  if (!email || !token) throw new Error("BB_EMAIL and BB_TOKEN required in .env");
  return `${email}:${token}`;
};

export const request = async (endpoint: string, options: RequestOptions = {}) => {
  const { method = "GET", body } = options;
  const url = `${BASE_URL}${endpoint}`;
  const auth = getAuth();

  let cmd = `curl -s -u "${auth}" -X ${method}`;

  if (body) {
    cmd += ` -H "Content-Type: application/json"`;
    cmd += ` -d '${JSON.stringify(body)}'`;
  }

  cmd += ` "${url}"`;

  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout);
};
