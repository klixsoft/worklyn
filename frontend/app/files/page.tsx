"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Folder,
  File,
  FolderPlus,
  UploadCloud,
  Search,
  MoreVertical,
  Download,
  Trash2,
  Globe,
  Lock,
  Eye,
  ChevronRight,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileCode,
  Play,
  Info,
  Calendar,
  Layers,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { clientApi } from "@/lib/api/client";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { useDeleteConfirmation } from "@/components/auth/delete-confirmation-context";


interface FolderType {
  id: string;
  name: string;
  parent_id: string | null;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface FileType {
  id: string;
  name: string;
  folder_id: string | null;
  owner_id: string;
  size: number;
  mime_type: string;
  s3_key: string;
  is_public: boolean;
  created_at: string;
  download_url?: string;
}

interface FolderContents {
  folder: FolderType;
  subfolders: FolderType[];
  files: FileType[];
}

export default function FileManagerPage() {
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [selectedItem, setSelectedItem] = useState<{ type: "folder" | "file"; data: any } | null>(null);
  const [search, setSearch] = useState("");
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const { confirmDelete } = useDeleteConfirmation();

  const handleDeleteClick = (type: "folder" | "file", id: string, name: string) => {
    confirmDelete(async () => {
      if (type === "folder") {
        await deleteFolderMutation.mutateAsync(id);
      } else {
        await deleteFileMutation.mutateAsync(id);
      }
    });
  };



  // Fetch all folders for tree representation
  const { data: allFolders = [], isLoading: isLoadingFolders } = useQuery<FolderType[]>({
    queryKey: ["storage", "folders"],
    queryFn: () => clientApi.get("storage/folders").json(),
  });

  // Fetch contents of current folder
  const { data: contents, isLoading: isLoadingContents } = useQuery<FolderContents>({
    queryKey: ["storage", "contents", currentFolderId],
    queryFn: () => clientApi.get(`storage/folders/${currentFolderId}/contents`).json(),
  });

  // Automatically select the active folder for details panel if no file is selected
  useEffect(() => {
    if (contents?.folder && (!selectedItem || selectedItem.type === "folder")) {
      setSelectedItem({ type: "folder", data: contents.folder });
    }
  }, [contents, currentFolderId]);

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: (newFolder: { name: string; parent_id: string | null }) =>
      clientApi.post("storage/folders", { json: newFolder }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      toast.success("Folder created successfully");
      setIsNewFolderOpen(false);
      setNewFolderName("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create folder");
    }
  });

  // Toggle folder visibility mutation
  const toggleFolderPublicMutation = useMutation({
    mutationFn: ({ id, is_public }: { id: string; is_public: boolean }) =>
      clientApi.put(`storage/folders/${id}`, { json: { is_public } }).json(),
    onSuccess: (updatedFolder: any) => {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      setSelectedItem({ type: "folder", data: updatedFolder });
      toast.success(`Folder is now ${updatedFolder.is_public ? "Public" : "Private"}`);
    },
  });

  // Toggle file visibility mutation
  const toggleFilePublicMutation = useMutation({
    mutationFn: ({ id, is_public }: { id: string; is_public: boolean }) =>
      clientApi.put(`storage/files/${id}`, { searchParams: { is_public } }).json(),
    onSuccess: (updatedFile: any) => {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      setSelectedItem({ type: "file", data: updatedFile });
      toast.success(`File is now ${updatedFile.is_public ? "Public" : "Private"}`);
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => clientApi.delete(`storage/files/${id}`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      setSelectedItem(contents?.folder ? { type: "folder", data: contents.folder } : null);
      toast.success("File deleted successfully");
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => clientApi.delete(`storage/folders/${id}`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      setCurrentFolderId("root");
      toast.success("Folder and its contents deleted successfully");
    },
  });

  // File Upload flow
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    try {
      setUploadProgress(10);

      // 1. Get presigned upload URL
      const presignResponse: { upload_url: string; s3_key: string } = await clientApi.post(
        "storage/files/presign-upload",
        {
          json: {
            name: file.name,
            mime_type: file.type || "application/octet-stream",
            size: file.size,
            folder_id: currentFolderId === "root" ? null : currentFolderId
          }
        }
      ).json();

      setUploadProgress(40);

      // 2. Upload file directly to S3/R2 via Presigned URL
      const uploadRes = await fetch(presignResponse.upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        }
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file binary to storage server");
      }

      setUploadProgress(80);

      // 3. Confirm upload with Backend to save in database
      await clientApi.post("storage/files/confirm-upload", {
        json: {
          name: file.name,
          mime_type: file.type || "application/octet-stream",
          size: file.size,
          s3_key: presignResponse.s3_key,
          folder_id: currentFolderId === "root" ? null : currentFolderId
        }
      }).json();

      toast.success(`${file.name} uploaded successfully!`);
      queryClient.invalidateQueries({ queryKey: ["storage"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate({
      name: newFolderName.trim(),
      parent_id: currentFolderId === "root" ? null : currentFolderId,
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith("image/")) return <ImageIcon className="h-10 w-10 text-emerald-500" />;
    if (mime.startsWith("video/")) return <Play className="h-10 w-10 text-rose-500" />;
    if (mime.startsWith("audio/")) return <Play className="h-10 w-10 text-violet-500" />;
    if (mime.includes("pdf") || mime.includes("document") || mime.includes("text")) return <FileText className="h-10 w-10 text-blue-500" />;
    if (mime.includes("zip") || mime.includes("tar") || mime.includes("rar")) return <FileArchive className="h-10 w-10 text-amber-500" />;
    if (mime.includes("javascript") || mime.includes("json") || mime.includes("html") || mime.includes("css")) return <FileCode className="h-10 w-10 text-indigo-500" />;
    return <File className="h-10 w-10 text-slate-400" />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Build folder hierarchy list
  const getSubfoldersForTree = (parentId: string | null): FolderType[] => {
    return allFolders.filter(f => f.parent_id === parentId);
  };

  // Recursive Tree Node Renderer
  const TreeNode = ({ folder, level = 0 }: { folder: FolderType; level: number }) => {
    const childs = getSubfoldersForTree(folder.id);
    const isSelected = currentFolderId === folder.id;
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="select-none">
        <div
          onClick={() => {
            setCurrentFolderId(folder.id);
            setSelectedItem({ type: "folder", data: folder });
          }}
          className={`group flex items-center justify-between py-1.5 px-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${isSelected ? "bg-indigo-600/10 text-indigo-400 font-semibold" : "text-muted-foreground hover:text-foreground"}`}
          style={{ paddingLeft: `${Math.max(10, level * 16)}px` }}
        >
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            {childs.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="p-0.5 hover:bg-muted rounded text-muted-foreground cursor-pointer"
              >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <Folder className={`h-4 w-4 shrink-0 ${isSelected ? "text-indigo-400" : "text-zinc-400 group-hover:text-foreground"}`} />
            <span className="text-xs truncate capitalize">{folder.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {folder.is_public && <Globe className="h-3 w-3 text-emerald-500 opacity-80" />}
            {folder.parent_id !== null && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick("folder", folder.id, folder.name);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/15 rounded text-muted-foreground hover:text-destructive transition-all cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {expanded && childs.map(child => (
          <TreeNode key={child.id} folder={child} level={level + 1} />
        ))}
      </div>
    );
  };

  const filteredFiles = contents?.files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredFolders = contents?.subfolders.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row overflow-hidden border border-border rounded-lg bg-card/30 backdrop-blur-xl">
      {/* 1. Left Sidebar: Folder Tree */}
      <div className="w-full md:w-64 border-r border-border bg-card/60 flex flex-col h-1/3 md:h-full shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Folders</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNewFolderOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {/* Root folder tree list */}
            {allFolders.filter(f => f.parent_id === null || !allFolders.some(parent => parent.id === f.parent_id)).map(rootFolder => (
              <TreeNode key={rootFolder.id} folder={rootFolder} level={0} />
            ))}
            {allFolders.length === 0 && !isLoadingFolders && (
              <p className="text-[11px] text-muted-foreground p-3 text-center">No folder tree loaded</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 2. Main File Area */}
      <div className="flex-1 flex flex-col bg-background/20 h-2/3 md:h-full overflow-hidden">
        {/* Header toolbar */}
        <div className="p-4 border-b border-border bg-card/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
            <Folder className="h-5 w-5 text-indigo-400 shrink-0" />
            <h1 className="text-sm font-bold text-foreground capitalize truncate">
              {contents?.folder?.name || "Files"}
            </h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs bg-background/50 border-border"
              />
            </div>
            <label className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold cursor-pointer shrink-0 transition-all active:scale-95">
              <UploadCloud className="h-4 w-4" />
              <span>Upload</span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadProgress !== null}
              />
            </label>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploadProgress !== null && (
          <div className="w-full bg-muted h-1 relative overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Content list/grid */}
        <ScrollArea className="flex-1 p-4">
          {isLoadingContents ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-xs text-muted-foreground animate-pulse">Loading folder contents...</p>
            </div>
          ) : filteredFiles.length === 0 && filteredFolders.length === 0 ? (
            <Empty className="py-20 border border-dashed border-border/60 rounded-xl bg-card/10">
              <EmptyMedia variant="icon" className="mb-2">
                <Folder className="h-10 w-10 text-muted-foreground/40" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle className="text-sm font-bold text-foreground">Folder is empty</EmptyTitle>
                <EmptyDescription className="text-xs text-muted-foreground/70">
                  Upload files or create subfolders to start organizing.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-6">
              {/* Folder list inside main area */}
              {filteredFolders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Folders</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredFolders.map(folder => (
                      <div
                        key={folder.id}
                        onDoubleClick={() => setCurrentFolderId(folder.id)}
                        onClick={() => setSelectedItem({ type: "folder", data: folder })}
                        className={`group p-3 border rounded-xl flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all hover:scale-[1.02] ${selectedItem?.type === "folder" && selectedItem.data.id === folder.id ? "border-indigo-500/50 bg-indigo-500/5 shadow-inner" : "border-border bg-card/40 hover:bg-card/80"}`}
                      >
                        <Folder className="h-8 w-8 text-zinc-400 group-hover:text-indigo-400 shrink-0" />
                        <div className="text-left overflow-hidden">
                          <p className="text-xs font-semibold text-foreground truncate capitalize">{folder.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{folder.is_public ? "Public" : "Private"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File list inside main area */}
              {filteredFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Files</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredFiles.map(file => (
                      <div
                        key={file.id}
                        onClick={() => setSelectedItem({ type: "file", data: file })}
                        className={`group p-3 border rounded-xl flex flex-col justify-between h-32 cursor-pointer hover:shadow-sm transition-all hover:scale-[1.02] ${selectedItem?.type === "file" && selectedItem.data.id === file.id ? "border-indigo-500/50 bg-indigo-500/5 shadow-inner" : "border-border bg-card/40 hover:bg-card/80"}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          {getFileIcon(file.mime_type)}
                          <div className="flex items-center gap-1">
                            {file.is_public ? <Globe className="h-3 w-3 text-emerald-500" /> : <Lock className="h-3 w-3 text-zinc-500" />}
                          </div>
                        </div>
                        <div className="text-left overflow-hidden mt-2">
                          <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 3. Right Sidebar: Details Panel */}
      {selectedItem && (
        <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-border bg-card/60 flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Details</h2>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-5">
              {/* Icon / Overview */}
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border border-border/40 rounded-xl text-center">
                {selectedItem.type === "folder" ? (
                  <Folder className="h-16 w-16 text-indigo-400/80 mb-2" />
                ) : (
                  getFileIcon(selectedItem.data.mime_type)
                )}
                <h3 className="text-sm font-bold text-foreground truncate max-w-full capitalize mt-2">
                  {selectedItem.data.name}
                </h3>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {selectedItem.type === "folder" ? "Folder Folder" : selectedItem.data.mime_type}
                </span>
              </div>

              {/* Access Control section */}
              <div className="p-3 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {selectedItem.data.is_public ? <Globe className="h-4 w-4 text-emerald-500" /> : <Lock className="h-4 w-4 text-zinc-500" />}
                    <span className="text-xs font-semibold text-foreground">
                      {selectedItem.data.is_public ? "Public Access" : "Private Access"}
                    </span>
                  </div>
                  <Switch
                    checked={selectedItem.data.is_public}
                    onCheckedChange={(checked) => {
                      if (selectedItem.type === "folder") {
                        toggleFolderPublicMutation.mutate({ id: selectedItem.data.id, is_public: checked });
                      } else {
                        toggleFilePublicMutation.mutate({ id: selectedItem.data.id, is_public: checked });
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {selectedItem.data.is_public
                    ? "Anyone in the organization can view this folder/file."
                    : "Only you (and super admins) can view or modify this folder/file."}
                </p>
              </div>

              {/* Meta properties */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created</span>
                  <span className="font-semibold text-foreground">{new Date(selectedItem.data.created_at).toLocaleDateString()}</span>
                </div>
                {selectedItem.type === "file" && (
                  <>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> Size</span>
                      <span className="font-semibold text-foreground">{formatBytes(selectedItem.data.size)}</span>
                    </div>
                    {/* Share / Copy Link if public */}
                    {selectedItem.data.is_public && selectedItem.data.download_url && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] text-muted-foreground font-bold">Public Link</span>
                        <div className="flex gap-1">
                          <Input
                            readOnly
                            value={selectedItem.data.download_url}
                            className="h-8 text-[10px] bg-muted/30 border-border font-mono select-all truncate"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 cursor-pointer"
                            onClick={() => copyToClipboard(selectedItem.data.download_url)}
                          >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {selectedItem.type === "file" && selectedItem.data.download_url && (
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 gap-1 h-9 text-xs cursor-pointer"
                  >
                    <a href={selectedItem.data.download_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="flex-1 gap-1 h-9 text-xs cursor-pointer"
                  onClick={() => {
                    if (selectedItem) {
                      handleDeleteClick(selectedItem.type, selectedItem.data.id, selectedItem.data.name);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* New Folder Modal */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[400px]">
          <DialogHeader className="text-left">
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>Create a new folder to organize your files.</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-left">
            <Input
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-background border-border text-foreground"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsNewFolderOpen(false)} className="text-muted-foreground cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
