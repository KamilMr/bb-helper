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

interface CreateRepoOptions {
  workspace: string;
  slug: string;
  projectKey?: string;
  isPrivate?: boolean;
  description?: string;
}

export const createRepo = async (options: CreateRepoOptions) => {
  const { workspace, slug, projectKey, isPrivate = true, description } = options;

  const body: Record<string, unknown> = {
    scm: "git",
    is_private: isPrivate,
  };

  if (projectKey) body.project = { key: projectKey };
  if (description) body.description = description;

  return request(`/repositories/${workspace}/${slug}`, { method: "POST", body });
};

export const getUser = () => request("/user");

export const listWorkspaces = () => request("/workspaces");

export const listRepos = (workspace: string) =>
  request(`/repositories/${workspace}`);

export const deleteRepo = (workspace: string, slug: string) =>
  request(`/repositories/${workspace}/${slug}`, { method: "DELETE" });

interface CreateProjectOptions {
  workspace: string;
  name: string;
  key: string;
  isPrivate?: boolean;
}

export const createProject = async (options: CreateProjectOptions) => {
  const { workspace, name, key, isPrivate = true } = options;

  return request(`/workspaces/${workspace}/projects`, {
    method: "POST",
    body: { name, key, is_private: isPrivate },
  });
};
