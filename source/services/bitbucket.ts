import { exec } from "child_process";
import { promisify } from "util";
import type { User, Workspace, Repository, Project, PaginatedResponse } from "../types/api.js";

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

export const request = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
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
  if (!stdout.trim()) return {} as T;
  return JSON.parse(stdout);
};

export interface CreateRepoOptions {
  workspace: string;
  slug: string;
  projectKey?: string;
  isPrivate?: boolean;
  description?: string;
}

export const createRepo = async (options: CreateRepoOptions): Promise<Repository> => {
  const { workspace, slug, projectKey, isPrivate = true, description } = options;

  const body: Record<string, unknown> = {
    scm: "git",
    is_private: isPrivate,
  };

  if (projectKey) body.project = { key: projectKey };
  if (description) body.description = description;

  return request<Repository>(`/repositories/${workspace}/${slug}`, { method: "POST", body });
};

export const getUser = (): Promise<User> => request<User>("/user");

export const listWorkspaces = (): Promise<PaginatedResponse<Workspace>> =>
  request<PaginatedResponse<Workspace>>("/workspaces");

export const listRepos = (workspace: string): Promise<PaginatedResponse<Repository>> =>
  request<PaginatedResponse<Repository>>(`/repositories/${workspace}`);

export const deleteRepo = (workspace: string, slug: string): Promise<void> =>
  request<void>(`/repositories/${workspace}/${slug}`, { method: "DELETE" });

export interface CreateProjectOptions {
  workspace: string;
  name: string;
  key: string;
  isPrivate?: boolean;
}

export const createProject = async (options: CreateProjectOptions): Promise<Project> => {
  const { workspace, name, key, isPrivate = true } = options;

  return request<Project>(`/workspaces/${workspace}/projects`, {
    method: "POST",
    body: { name, key, is_private: isPrivate },
  });
};
