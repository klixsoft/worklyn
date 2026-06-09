import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Folder, File, Search, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { clientApi } from "@/lib/api/client";

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

interface FolderType {
  id: string;
  name: string;
  parent_id: string | null;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface FolderContents {
  folder: FolderType;
  subfolders: FolderType[];
  files: FileType[];
}

interface FilePickerProps {
  onSelect: (file: FileType) => void;
  trigger?: React.ReactNode;
}

export function FilePicker({ onSelect, trigger }: FilePickerProps) {
  const [open, setOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [search, setSearch] = useState("");

  const { data: contents, isLoading } = useQuery<FolderContents>({
    queryKey: ["storage", "contents", currentFolderId],
    queryFn: () => clientApi.get(`storage/folders/${currentFolderId}/contents`).json(),
    enabled: open,
  });

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      setOpen(false);
    }
  };

  const filteredFiles = contents?.files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredFolders = contents?.subfolders.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" className="cursor-pointer">Select File</Button>}
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border text-left">
          <DialogTitle className="text-lg font-bold">Select File</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Browse your folders and select a file.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="p-3 bg-muted/20 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Folder className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-semibold truncate capitalize">
              {contents?.folder?.name || "Files"}
            </span>
          </div>
          <div className="relative w-44">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-[11px] bg-background/50 border-border"
            />
          </div>
        </div>

        {/* Folder contents */}
        <ScrollArea className="h-72 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-xs text-muted-foreground animate-pulse">Loading files...</p>
            </div>
          ) : filteredFiles.length === 0 && filteredFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Folder className="h-10 w-10 text-muted-foreground/30 mb-1" />
              <p className="text-xs text-muted-foreground">This folder has no contents</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Subfolders */}
              {filteredFolders.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Folders</span>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredFolders.map(folder => (
                      <div
                        key={folder.id}
                        onDoubleClick={() => {
                          setCurrentFolderId(folder.id);
                          setSelectedFile(null);
                        }}
                        className="flex items-center justify-between p-2 border border-border bg-card/40 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className="h-4 w-4 text-zinc-400 shrink-0" />
                          <span className="text-xs truncate capitalize">{folder.name}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {filteredFiles.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Files</span>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredFiles.map(file => {
                      const isSelected = selectedFile?.id === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => setSelectedFile(file)}
                          className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${isSelected ? "border-indigo-500 bg-indigo-500/5" : "border-border bg-card/40 hover:bg-muted/40"}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <File className="h-4 w-4 text-zinc-400 shrink-0" />
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
          {currentFolderId !== "root" && (
            <Button 
              variant="ghost" 
              onClick={() => {
                if (contents?.folder?.parent_id) {
                  setCurrentFolderId(contents.folder.parent_id);
                } else {
                  setCurrentFolderId("root");
                }
                setSelectedFile(null);
              }}
              className="text-xs mr-auto h-8 px-2 cursor-pointer"
            >
              Back
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)} 
            className="text-xs text-muted-foreground cursor-pointer h-8"
          >
            Cancel
          </Button>
          <Button 
            disabled={!selectedFile}
            onClick={handleSelect}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer h-8"
          >
            Select File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
