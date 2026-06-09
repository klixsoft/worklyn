"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/app/context";
import { SlackChat } from "@/components/slack-chat";

export default function ProjectChannelPage() {
  const params = useParams();
  const projectId = params.id as string;
  const channelId = params.channelId as string;

  const { setActiveProjectId, setActiveChannel } = useWorkspace();

  useEffect(() => {
    if (projectId) setActiveProjectId(projectId);
    if (channelId) setActiveChannel(channelId, "project");
  }, [projectId, channelId, setActiveProjectId, setActiveChannel]);

  return <SlackChat />;
}
