"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/app/context";
import { JiraBoard } from "@/components/jira-board";

export default function ProjectKanbanPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { projects, activeProject, activeProjectId, setActiveProjectId } = useWorkspace();

  // Check whether this project exists in the workspace context (mock projects)
  const isWorkspaceProject = projects.some((p) => p.id === projectId);

  // Sync URL project ID into workspace context
  useEffect(() => {
    if (projectId && activeProjectId !== projectId) {
      setActiveProjectId(projectId);
    }
  }, [projectId, activeProjectId, setActiveProjectId]);

  // For workspace projects: wait until the context syncs before rendering JiraBoard
  // so it never flashes the "No Project Selected" empty state
  if (isWorkspaceProject && (activeProjectId !== projectId || !activeProject)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <JiraBoard />;
}
