import type {
  User,
  Workspace,
  Repository,
  Project,
  PullRequest,
  PullRequestComment,
  PullRequestParticipant,
  PaginatedResponse,
} from "../types/api.js";

const BASE_URL = "https://api.bitbucket.org/2.0";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
}
export interface CreateProjectOptions {
  workspace: string;
  name: string;
  key: string;
  isPrivate?: boolean;
}

export interface CreateRepoOptions {
  workspace: string;
  slug: string;
  projectKey?: string;
  isPrivate?: boolean;
  description?: string;
}

export interface CreatePROptions {
  workspace: string;
  repoSlug: string;
  title: string;
  sourceBranch: string;
  destinationBranch: string;
  description?: string;
  reviewers?: string[];
  closeSourceBranch?: boolean;
  draft?: boolean;
}

export interface MergePROptions {
  workspace: string;
  repoSlug: string;
  pullRequestId: number;
  confirmation: string;
  message?: string;
  strategy?: string;
  closeSourceBranch?: boolean;
}

export const getMergeConfirmationError = (
  pullRequestId: number,
  confirmation?: string,
): string | null => {
  const expected = String(pullRequestId);

  if (confirmation === undefined) {
    return `Confirmation required: type pull request ID "${expected}" or pass --confirm-id=${expected} for JSON/non-interactive use. Pull request was not merged.`;
  }
  if (confirmation === "") {
    return `Merge cancelled. Pull request #${expected} was not merged.`;
  }
  if (confirmation !== expected) {
    return `Confirmation ${JSON.stringify(confirmation)} does not exactly match pull request ID "${expected}". Pull request was not merged.`;
  }

  return null;
};

const getAuthorization = () => {
  const email = process.env.BB_EMAIL;
  const token = process.env.BB_TOKEN;
  if (!email || !token) throw new Error("BB_EMAIL and BB_TOKEN required in .env");
  return `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
};

const request = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const { method = "GET", body } = options;
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: getAuthorization(),
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data: unknown;

  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const apiError = data as { error?: { message?: string; detail?: string } } | undefined;
    const message = apiError?.error?.message || apiError?.error?.detail || response.statusText;
    throw new Error(`Bitbucket API ${response.status}: ${message}`);
  }

  return data as T;
};

const repositoryPath = (workspace: string, repoSlug: string) =>
  `/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repoSlug)}`;

const pullRequestPath = (workspace: string, repoSlug: string, pullRequestId?: number) =>
  `${repositoryPath(workspace, repoSlug)}/pullrequests${pullRequestId === undefined ? "" : `/${pullRequestId}`}`;

export const getUser = (): Promise<User> => request<User>("/user");

export const listRepos = (workspace: string): Promise<PaginatedResponse<Repository>> =>
  request<PaginatedResponse<Repository>>(`/repositories/${encodeURIComponent(workspace)}?pagelen=100`);

export const deleteRepo = (workspace: string, slug: string): Promise<void> =>
  request<void>(repositoryPath(workspace, slug), { method: "DELETE" });

// Repository 
export const createRepo = async (options: CreateRepoOptions): Promise<Repository> => {
  const { workspace, slug, projectKey, isPrivate = true, description } = options;

  const body: Record<string, unknown> = {
    scm: "git",
    is_private: isPrivate,
  };

  if (projectKey) body.project = { key: projectKey };
  if (description) body.description = description;

  return request<Repository>(repositoryPath(workspace, slug), { method: "POST", body });
};

// Workspaces methods 
export const listWorkspaces = (): Promise<PaginatedResponse<Workspace>> =>
  request<PaginatedResponse<Workspace>>("/workspaces");

// Project methods
export const createProject = async (options: CreateProjectOptions): Promise<Project> => {
  const { workspace, name, key, isPrivate = true } = options;

  return request<Project>(`/workspaces/${workspace}/projects`, {
    method: "POST",
    body: { name, key, is_private: isPrivate },
  });
};

// Pull Request methods
export const listPullRequests = (
  workspace: string,
  repoSlug: string,
  state?: string
): Promise<PaginatedResponse<PullRequest>> => {
  const query = new URLSearchParams({ pagelen: "100" });
  if (state) query.set("state", state);
  return request<PaginatedResponse<PullRequest>>(`${pullRequestPath(workspace, repoSlug)}?${query}`);
};

export const getPullRequest = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
): Promise<PullRequest> => request<PullRequest>(pullRequestPath(workspace, repoSlug, pullRequestId));

export const createPullRequest = (options: CreatePROptions): Promise<PullRequest> => {
  const body: Record<string, unknown> = {
    title: options.title,
    source: { branch: { name: options.sourceBranch } },
    destination: { branch: { name: options.destinationBranch } },
  };

  if (options.description) body.description = options.description;
  if (options.reviewers?.length) body.reviewers = options.reviewers.map(uuid => ({ uuid }));
  if (options.closeSourceBranch !== undefined) body.close_source_branch = options.closeSourceBranch;
  if (options.draft !== undefined) body.draft = options.draft;

  return request<PullRequest>(pullRequestPath(options.workspace, options.repoSlug), {
    method: "POST",
    body,
  });
};

export const approvePullRequest = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
): Promise<PullRequestParticipant> =>
  request<PullRequestParticipant>(`${pullRequestPath(workspace, repoSlug, pullRequestId)}/approve`, {
    method: "POST",
  });

export const unapprovePullRequest = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
): Promise<void> =>
  request<void>(`${pullRequestPath(workspace, repoSlug, pullRequestId)}/approve`, {
    method: "DELETE",
  });

export const declinePullRequest = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
): Promise<PullRequest> =>
  request<PullRequest>(`${pullRequestPath(workspace, repoSlug, pullRequestId)}/decline`, {
    method: "POST",
  });

export const mergePullRequest = async (options: MergePROptions): Promise<PullRequest> => {
  const confirmationError = getMergeConfirmationError(options.pullRequestId, options.confirmation);
  if (confirmationError) throw new Error(confirmationError);

  const body: Record<string, unknown> = {};
  if (options.message) body.message = options.message;
  if (options.strategy) body.merge_strategy = options.strategy;
  if (options.closeSourceBranch !== undefined) body.close_source_branch = options.closeSourceBranch;

  return request<PullRequest>(
    `${pullRequestPath(options.workspace, options.repoSlug, options.pullRequestId)}/merge`,
    { method: "POST", body },
  );
};

export const requestPullRequestChanges = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
): Promise<PullRequestParticipant> =>
  request<PullRequestParticipant>(
    `${pullRequestPath(workspace, repoSlug, pullRequestId)}/request-changes`,
    { method: "POST" },
  );

export const removePullRequestChangeRequest = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
): Promise<void> =>
  request<void>(`${pullRequestPath(workspace, repoSlug, pullRequestId)}/request-changes`, {
    method: "DELETE",
  });

export const listPullRequestComments = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
): Promise<PaginatedResponse<PullRequestComment>> =>
  request<PaginatedResponse<PullRequestComment>>(
    `${pullRequestPath(workspace, repoSlug, pullRequestId)}/comments?pagelen=100`,
  );

export const addPullRequestComment = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
  content: string,
  parentId?: number,
): Promise<PullRequestComment> => {
  const body: Record<string, unknown> = { content: { raw: content } };
  if (parentId !== undefined) body.parent = { id: parentId };

  return request<PullRequestComment>(
    `${pullRequestPath(workspace, repoSlug, pullRequestId)}/comments`,
    { method: "POST", body },
  );
};

export const editPullRequestComment = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
  commentId: number,
  content: string,
): Promise<PullRequestComment> =>
  request<PullRequestComment>(
    `${pullRequestPath(workspace, repoSlug, pullRequestId)}/comments/${commentId}`,
    { method: "PUT", body: { content: { raw: content } } },
  );

export const deletePullRequestComment = (
  workspace: string,
  repoSlug: string,
  pullRequestId: number,
  commentId: number,
): Promise<void> =>
  request<void>(`${pullRequestPath(workspace, repoSlug, pullRequestId)}/comments/${commentId}`, {
    method: "DELETE",
  });
