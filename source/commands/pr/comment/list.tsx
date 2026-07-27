import React from "react";
import { Text } from "ink";
import { Alert } from "@inkjs/ui";
import zod from "zod";
import { argument } from "pastel";
import { listPullRequestComments } from "../../../services/bitbucket.js";
import { useApi } from "../../../hooks/useApi.js";
import { JsonOutput, Layout, LoadingState, Table } from "../../../components/index.js";

export const options = zod.object({ json: zod.boolean().default(false).describe("Output as JSON for agents") });
export const args = zod.tuple([
  zod.string().describe(argument({ name: "workspace", description: "Workspace slug" })),
  zod.string().describe(argument({ name: "repo", description: "Repository slug" })),
  zod.coerce.number().int().positive().describe(argument({ name: "id", description: "Pull request ID" })),
]);
type Props = { options: zod.infer<typeof options>; args: zod.infer<typeof args> };
type CommentRow = { id: number; author: string; comment: string };
const columns = [
  { key: "id" as keyof CommentRow, header: "ID", width: 7 },
  { key: "author" as keyof CommentRow, header: "Author", width: 20 },
  { key: "comment" as keyof CommentRow, header: "Comment", width: 60 },
];

export default function ListComments({ options: { json }, args: [workspace, repo, id] }: Props) {
  const { data, loading, error } = useApi(() => listPullRequestComments(workspace, repo, id));
  if (json) {
    if (loading) return null;
    return <JsonOutput data={data?.values ?? []} error={error} />;
  }
  if (loading) return <LoadingState label={`Fetching comments for pull request #${id}...`} />;
  if (error) return <Layout><Alert variant="error">{error}</Alert></Layout>;

  const comments: CommentRow[] = (data?.values ?? []).filter(comment => !comment.deleted).map(comment => ({
    id: comment.id,
    author: comment.user.display_name,
    comment: comment.content.raw.replace(/\s+/g, " "),
  }));
  return (
    <Layout title={`Comments on Pull Request #${id}`}>
      {comments.length ? <Table data={comments} columns={columns} /> : <Text dimColor>No comments found</Text>}
    </Layout>
  );
}
