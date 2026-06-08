"use client";

import React, { useState } from "react";
import { useWorkspace } from "@/app/context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Search } from "lucide-react";
import { User } from "@/app/context";

const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
];

export default function UsersPage() {
  const { teamMembers, currentUser, roles, addTeamMember, removeTeamMember, updateTeamMember } = useWorkspace();

  const allUsers: (User & { isCurrentUser?: boolean })[] = [
    { ...currentUser, isCurrentUser: true },
    ...teamMembers,
  ];

  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Add form state
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("");
  const [addStatus, setAddStatus] = useState<"online" | "idle" | "offline">("online");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState<"online" | "idle" | "offline">("online");

  const filtered = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addRole.trim()) return;
    const randomAvatar = AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
    addTeamMember(addName, addRole, randomAvatar, addStatus);
    setAddName("");
    setAddRole("");
    setAddStatus("online");
    setIsAddOpen(false);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser || !editName.trim() || !editRole.trim()) return;
    updateTeamMember(editUser.id, { name: editName, role: editRole, status: editStatus });
    setEditUser(null);
  };

  const handleDelete = () => {
    if (deleteUserId) {
      removeTeamMember(deleteUserId);
      setDeleteUserId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "idle": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "offline": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "idle": return "bg-amber-500";
      case "offline": return "bg-muted-foreground/40";
      default: return "bg-muted-foreground/40";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-left">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-foreground font-medium">Users</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage team members, assign roles, and control access across all modules.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: allUsers.length, color: "text-indigo-400" },
          { label: "Online", value: allUsers.filter(u => u.status === "online").length, color: "text-green-400" },
          { label: "Idle", value: allUsers.filter(u => u.status === "idle").length, color: "text-amber-400" },
          { label: "Offline", value: allUsers.filter(u => u.status === "offline").length, color: "text-muted-foreground" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border text-foreground">
            <CardContent className="p-4 text-left">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="bg-card border-border text-foreground">
        <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
          <div className="text-left">
            <CardTitle className="text-base">All Members</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""} in your workspace
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 bg-background border-border text-foreground text-xs w-52"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-semibold pl-4">Member</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">Role</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">Email</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs bg-indigo-600/20 text-indigo-400">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                            getStatusDot(user.status)
                          )} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-foreground leading-none">
                            {user.name}
                            {user.isCurrentUser && (
                              <span className="ml-1.5 text-[9px] font-bold text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] capitalize font-semibold border", getStatusColor(user.status))}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5 inline-block", getStatusDot(user.status))} />
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      {!user.isCurrentUser ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground w-36">
                            <DropdownMenuItem
                              onClick={() => openEdit(user)}
                              className="text-xs gap-2 cursor-pointer hover:bg-muted"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => setDeleteUserId(user.id)}
                              className="text-xs gap-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer focus:text-rose-400 focus:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40 pr-2">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[400px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border text-left">
            <DialogTitle className="text-lg font-bold">Add Team Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new member to your workspace team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-0">
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Full Name</Label>
                <Input
                  required
                  placeholder="e.g. Jane Doe"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Role</Label>
                <Select value={addRole} onValueChange={setAddRole}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground text-xs">
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {roles.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Status</Label>
                <Select value={addStatus} onValueChange={(v) => setAddStatus(v as any)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="online" className="text-xs">Online</SelectItem>
                    <SelectItem value="idle" className="text-xs">Idle</SelectItem>
                    <SelectItem value="offline" className="text-xs">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[400px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border text-left">
            <DialogTitle className="text-lg font-bold">Edit Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update {editUser?.name}&apos;s profile information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-0">
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Full Name</Label>
                <Input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {roles.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as any)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="online" className="text-xs">Online</SelectItem>
                    <SelectItem value="idle" className="text-xs">Idle</SelectItem>
                    <SelectItem value="offline" className="text-xs">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditUser(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(o) => !o && setDeleteUserId(null)}>
        <AlertDialogContent className="bg-card border-border text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Remove Member</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will permanently remove this member from your workspace. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-muted-foreground hover:text-foreground border-border bg-transparent cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
