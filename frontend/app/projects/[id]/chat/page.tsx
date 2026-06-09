"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/app/context";

/**
 * /projects/[id]/chat → redirects to the first text channel
 * so links always land on a specific channel URL.
 */
export default function ProjectChatIndexPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { projects, setActiveProjectId } = useWorkspace();

  useEffect(() => {
    if (!projectId) return;
    setActiveProjectId(projectId);

    const proj = projects.find((p) => p.id === projectId);
    const firstChannel = proj?.channels?.find((c) => c.type === "text");
    if (firstChannel) {
      router.replace(`/projects/${projectId}/chat/${firstChannel.id}`);
    }
  }, [projectId, projects, setActiveProjectId, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
