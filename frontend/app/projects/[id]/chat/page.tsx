"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/app/context";
import { SlackChat } from "@/components/slack-chat";

export default function ProjectChatPage() {
  const params = useParams();
  const { setActiveProjectId } = useWorkspace();
  
  useEffect(() => {
    if (params.id) {
      setActiveProjectId(params.id as string);
    }
  }, [params.id, setActiveProjectId]);
  
  return <SlackChat />;
}
