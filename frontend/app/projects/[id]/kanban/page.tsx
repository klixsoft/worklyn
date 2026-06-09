"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/app/context";
import { JiraBoard } from "@/components/jira-board";

export default function ProjectKanbanPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { activeProjectId, setActiveProjectId } = useWorkspace();

  useEffect(() => {
    if (projectId && activeProjectId !== projectId) {
      setActiveProjectId(projectId);
    }
  }, [projectId, activeProjectId, setActiveProjectId]);

  return <JiraBoard />;
}
