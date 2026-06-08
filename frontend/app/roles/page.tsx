"use client";

import React, { useState } from "react";
import { useWorkspace, RolePermissions, DEFAULT_ROLE_PERMISSIONS } from "@/app/context";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ShieldCheck,
  Users,
  Lock,
  Pencil,
  Kanban,
  DollarSign,
  UserCog,
} from "lucide-react";

const ROLE_COLORS = [
  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
];
const getRoleColor = (idx: number) => ROLE_COLORS[idx % ROLE_COLORS.length];

interface PermissionGroup {
  label: string;
  description: string;
  icon: React.ReactNode;
  items: {
    key: keyof Omit<RolePermissions, "modules">;
    label: string;
    description: string;
  }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Admin Permissions",
    description: "High-level access control",
    icon: <ShieldCheck className="h-4 w-4 text-indigo-400" />,
    items: [
      { key: "canManageUsers", label: "Manage Users", description: "Add, edit, and remove team members" },
      { key: "canManageRoles", label: "Manage Roles", description: "Create, edit, and delete roles" },
    ],
  },
  {
    label: "Project Management",
    description: "Access within the PM module",
    icon: <Kanban className="h-4 w-4 text-indigo-400" />,
    items: [
      { key: "canManageProjects", label: "Manage Projects", description: "Create and configure project spaces" },
      { key: "canManageTasks", label: "Manage Tasks", description: "Create, edit, move, and delete tasks" },
      { key: "canViewReports", label: "View Reports", description: "Access analytics and report dashboards" },
      { key: "canManageAttendance", label: "Manage Attendance", description: "Clock in/out and view attendance logs" },
    ],
  },
];

export default function RolesPage() {
  const { roles, teamMembers, currentUser, addRole, removeRole, rolePermissions, updateRolePermissions } = useWorkspace();

  const allUsers = [currentUser, ...teamMembers];
  const getRoleCount = (roleName: string) => allUsers.filter((u) => u.role === roleName).length;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [deleteRole, setDeleteRole] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    addRole(newRoleName);
    setNewRoleName("");
    setIsAddOpen(false);
  };

  const handleDelete = () => {
    if (deleteRole) {
      removeRole(deleteRole);
      setDeleteRole(null);
    }
  };

  const openEdit = (roleName: string) => {
    const existing = rolePermissions[roleName] || DEFAULT_ROLE_PERMISSIONS;
    setEditPerms(JSON.parse(JSON.stringify(existing))); // deep clone
    setEditingRole(roleName);
  };

  const toggleModule = (module: "pm" | "finance" | "hr") => {
    setEditPerms((prev) => ({
      ...prev,
      modules: { ...prev.modules, [module]: !prev.modules[module] },
    }));
  };

  const togglePerm = (key: keyof Omit<RolePermissions, "modules">) => {
    setEditPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePerms = () => {
    if (!editingRole) return;
    updateRolePermissions(editingRole, editPerms);
    setEditingRole(null);
  };

  const getPermsSummary = (roleName: string): string => {
    const perms = rolePermissions[roleName];
    if (!perms) return "Default access";
    const moduleCount = Object.values(perms.modules).filter(Boolean).length;
    const actionCount = [
      perms.canManageUsers, perms.canManageRoles, perms.canManageProjects,
      perms.canManageTasks, perms.canViewReports, perms.canManageAttendance,
    ].filter(Boolean).length;
    return `${moduleCount} module${moduleCount !== 1 ? "s" : ""}, ${actionCount} permission${actionCount !== 1 ? "s" : ""}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-left">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-foreground font-medium">Roles</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Role Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define roles, assign permissions, and control access across all software modules.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-card border-border text-foreground">
          <CardContent className="p-4 text-left">
            <p className="text-xs text-muted-foreground">Total Roles</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{roles.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border text-foreground">
          <CardContent className="p-4 text-left">
            <p className="text-xs text-muted-foreground">Assigned Roles</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {roles.filter((r) => getRoleCount(r) > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border text-foreground">
          <CardContent className="p-4 text-left">
            <p className="text-xs text-muted-foreground">Configured</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {roles.filter((r) => !!rolePermissions[r]).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Role Overview Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border text-foreground">
            <CardHeader className="border-b border-border pb-3 text-left">
              <CardTitle className="text-base">Role Overview</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Visual summary of all roles</CardDescription>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {roles.map((role, idx) => {
                const count = getRoleCount(role);
                return (
                  <div
                    key={role}
                    className="flex items-center justify-between rounded-lg px-3 py-2 bg-background border border-border/60 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">{role}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold border shrink-0 ml-2", getRoleColor(idx))}
                    >
                      {count} {count === 1 ? "user" : "users"}
                    </Badge>
                  </div>
                );
              })}
              {roles.length === 0 && (
                <div className="text-center py-8">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No roles defined yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Roles Table */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border text-foreground">
            <CardHeader className="border-b border-border pb-3 text-left">
              <CardTitle className="text-base">Roles & Permissions</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Manage roles and configure their access permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-semibold pl-4">Role</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Members</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Permissions</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Assigned To</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role, idx) => {
                    const count = getRoleCount(role);
                    const assignedUsers = allUsers.filter((u) => u.role === role);
                    const isProtected = count > 0;
                    const permsConfigured = !!rolePermissions[role];

                    return (
                      <TableRow key={role} className="border-border hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-4">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-semibold border", getRoleColor(idx))}
                          >
                            {role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-[11px] font-medium",
                            permsConfigured ? "text-emerald-400" : "text-muted-foreground/50"
                          )}>
                            {getPermsSummary(role)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {assignedUsers.length > 0 ? (
                            <div className="flex -space-x-1.5">
                              {assignedUsers.slice(0, 4).map((u) => (
                                <Tooltip key={u.id}>
                                  <TooltipTrigger>
                                    <div className="h-6 w-6 rounded-full border-2 border-card bg-indigo-600/30 flex items-center justify-center text-[9px] font-bold text-indigo-400 cursor-default">
                                      {u.name[0]}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-popover border-border text-popover-foreground text-xs">
                                    {u.name}
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {assignedUsers.length > 4 && (
                                <div className="h-6 w-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] text-muted-foreground">
                                  +{assignedUsers.length - 4}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit Permissions */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(role)}
                                  className="h-7 w-7 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="bg-popover border-border text-popover-foreground text-xs">
                                Edit permissions
                              </TooltipContent>
                            </Tooltip>

                            {/* Delete */}
                            {isProtected ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button variant="ghost" size="icon" disabled className="h-7 w-7 text-muted-foreground/30 cursor-not-allowed">
                                    <Lock className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-popover border-border text-popover-foreground text-xs max-w-[180px]">
                                  Cannot delete: {count} user{count > 1 ? "s" : ""} assigned
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteRole(role)}
                                className="h-7 w-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {roles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No roles found. Add your first role.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Add Role Dialog ─── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[360px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border text-left">
            <DialogTitle className="text-lg font-bold">Create Role</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new role to your workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-0">
            <div className="p-4">
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">Role Name</Label>
                <Input
                  required
                  placeholder="e.g. Mobile Developer"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
            <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">Create Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Permissions Dialog ─── */}
      <Dialog open={!!editingRole} onOpenChange={(o) => !o && setEditingRole(null)}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[520px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 border-b border-border text-left shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <DialogTitle className="text-base font-bold">Edit Permissions — {editingRole}</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Configure which software modules and actions this role can access.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">

            {/* Module Access */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                  Module Access
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <p className="text-xs text-muted-foreground">Which software platforms this role can access.</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "pm" as const, label: "Project Mgmt", icon: <Kanban className="h-4 w-4" />, color: "border-indigo-500/30 bg-indigo-500/5 text-indigo-400" },
                  { id: "finance" as const, label: "Finance Suite", icon: <DollarSign className="h-4 w-4" />, color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
                  { id: "hr" as const, label: "HR Mgmt", icon: <UserCog className="h-4 w-4" />, color: "border-violet-500/30 bg-violet-500/5 text-violet-400" },
                ]).map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all cursor-pointer",
                      editPerms.modules[mod.id]
                        ? mod.color
                        : "border-border/40 bg-background text-muted-foreground/40"
                    )}
                  >
                    {mod.icon}
                    <span className="text-[10px] font-semibold leading-tight">{mod.label}</span>
                    <span className={cn(
                      "text-[9px] font-bold",
                      editPerms.modules[mod.id] ? "opacity-100" : "opacity-40"
                    )}>
                      {editPerms.modules[mod.id] ? "Allowed" : "Denied"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Permission Groups */}
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <p className="text-xs text-muted-foreground">{group.description}</p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2.5 bg-background hover:border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={editPerms[item.key] as boolean}
                        onCheckedChange={() => togglePerm(item.key)}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-foreground">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="p-4 border-t border-border bg-card shrink-0 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditPerms(DEFAULT_ROLE_PERMISSIONS);
              }}
              className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
            >
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingRole(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">Cancel</Button>
              <Button onClick={handleSavePerms} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                Save Permissions
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={!!deleteRole} onOpenChange={(o) => !o && setDeleteRole(null)}>
        <AlertDialogContent className="bg-card border-border text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Role</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{deleteRole}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-muted-foreground hover:text-foreground border-border bg-transparent cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
