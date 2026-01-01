export interface User {
  uuid: string;
  username: string;
  display_name: string;
  account_id: string;
  links: {
    avatar: { href: string };
    html: { href: string };
  };
}

export interface Workspace {
  uuid: string;
  slug: string;
  name: string;
  type: string;
  links: {
    html: { href: string };
    avatar: { href: string };
  };
}

export interface Repository {
  uuid: string;
  slug: string;
  name: string;
  full_name: string;
  is_private: boolean;
  description: string;
  created_on: string;
  updated_on: string;
  project?: {
    key: string;
    name: string;
  };
  links: {
    html: { href: string };
    clone: Array<{ href: string; name: string }>;
  };
}

export interface Project {
  uuid: string;
  key: string;
  name: string;
  is_private: boolean;
  created_on: string;
  updated_on: string;
  links: {
    html: { href: string };
  };
}

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  created_on: string;
  updated_on: string;
  source: { branch: { name: string }; repository?: { full_name: string } };
  destination: { branch: { name: string }; repository?: { full_name: string } };
  author: User;
  reviewers: User[];
  close_source_branch: boolean;
  links: { html: { href: string } };
}

export interface PaginatedResponse<T> {
  size: number;
  page: number;
  pagelen: number;
  next?: string;
  previous?: string;
  values: T[];
}
