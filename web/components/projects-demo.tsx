import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/lib/api";
import { useSession } from "~/lib/auth-client";

export function ProjectsDemo() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  // Skipped until signed in — the routes require auth.
  const projectsQuery = useQuery(
    api.projects.$get.queryOptions({ enabled: !!session }),
  );

  const createProject = useMutation(
    api.projects.$post.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: api.projects.$get.queryOptions({}).queryKey,
        });
        setName("");
      },
    }),
  );

  const deleteProject = useMutation(
    api.projects[":id"].$delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: api.projects.$get.queryOptions({}).queryKey,
        });
        // Deleting frees a slot, so a prior "limit reached" no longer applies.
        createProject.reset();
      },
    }),
  );

  // `data` is now the project only — errors arrive on `error` as a typed
  // ApiError. Its `status` is a literal union (e.g. 409) and narrows `body`.
  const createError = createProject.error?.body.error ?? null;

  if (!session) {
    return (
      <div className="flex w-full max-w-md flex-col gap-2 rounded-lg border p-6">
        <h2 className="font-semibold text-xl">Projects</h2>
        <p className="text-muted-foreground text-sm">
          Sign in to see your projects.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border p-6">
      <h2 className="font-semibold text-xl">Projects</h2>

      <div className="flex gap-2">
        <Input
          placeholder="Project name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            // Clear a stale "limit reached" error once they start retrying.
            if (createProject.isError) createProject.reset();
          }}
          disabled={createProject.isPending}
        />
        <Button
          onClick={() => createProject.mutate({ json: { name } })}
          disabled={!name || createProject.isPending}
        >
          {createProject.isPending ? "Creating..." : "Create"}
        </Button>
      </div>

      {createError && <p className="text-red-600 text-sm">{createError}</p>}

      {projectsQuery.isPending ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {projectsQuery.data?.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            >
              {project.name}
              <Button
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() =>
                  deleteProject.mutate({ param: { id: project.id } })
                }
                disabled={deleteProject.isPending}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
