"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ShieldCheck, Pencil, Kanban, Users } from "lucide-react";
import { clientApi } from "@/lib/api/client";
import { handleApiError } from "@/lib/api/error-handler";
import { useDeleteConfirmation } from "@/components/auth/delete-confirmation-context";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

const ROLE_COLORS = [
  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
];
const getRoleColor = (idx: number) => ROLE_COLORS[idx % ROLE_COLORS.length];

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  permission_ids: z.array(z.string()).default([]),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { confirmDelete } = useDeleteConfirmation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { data: roles = [], isLoading: loadingRoles } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => clientApi.get("roles").json(),
  });

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: () => clientApi.get("roles/permissions").json(),
  });

  const createForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permission_ids: [],
    },
  });

  const editForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permission_ids: [],
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (values: RoleFormValues) => clientApi.post("roles", { json: values }).json(),
    onSuccess: () => {
      toast.success("Role created successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsAddOpen(false);
      createForm.reset();
    },
    onError: (err) => handleApiError(err, createForm),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: RoleFormValues }) => clientApi.put(`roles/${id}`, { json: values }).json(),
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setEditingRole(null);
      editForm.reset();
    },
    onError: (err) => handleApiError(err, editForm),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => clientApi.post(`roles/${id}/confirm-delete`, { json: { password } }).json(),
    onSuccess: () => {
      toast.success("Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (err) => handleApiError(err),
  });

  const handleCreateSubmit = React.useCallback((values: RoleFormValues) => {
    createRoleMutation.mutate(values);
  }, [createRoleMutation]);

  const handleUpdateSubmit = React.useCallback((values: RoleFormValues) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, values });
    }
  }, [editingRole, updateRoleMutation]);

  const initiateDelete = React.useCallback((id: string) => {
    confirmDelete(async (password) => {
      await deleteRoleMutation.mutateAsync({ id, password });
    });
  }, [confirmDelete, deleteRoleMutation]);

  const openEdit = React.useCallback((role: Role) => {
    setEditingRole(role);
    editForm.reset({
      name: role.name,
      permission_ids: role.permissions.map((p) => p.id),
    });
  }, [editForm]);

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-y-auto bg-background p-6 font-sans">
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

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="bg-card border-border text-foreground">
              <CardHeader className="border-b border-border pb-3 text-left">
                <CardTitle className="text-base">Role Overview</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Visual summary of all roles</CardDescription>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {roles.map((role, idx) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 bg-background border border-border/60 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">{role.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold border shrink-0 ml-2", getRoleColor(idx))}
                    >
                      {role.permissions.length} perms
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-card border-border text-foreground">
              <CardHeader className="border-b border-border pb-3 text-left">
                <CardTitle className="text-base">Roles & Permissions</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Manage roles and configure their access permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingRoles ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm text-muted-foreground">Loading roles...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-xs text-muted-foreground font-semibold pl-4">Role</TableHead>
                        <TableHead className="text-xs text-muted-foreground font-semibold">Permissions</TableHead>
                        <TableHead className="text-xs text-muted-foreground font-semibold text-right pr-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role, idx) => (
                        <TableRow key={role.id} className="border-border hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-4">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] font-semibold border", getRoleColor(idx))}
                            >
                              {role.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {role.permissions.map((p) => (
                                <Badge key={p.id} variant="outline" className="text-[9px]">
                                  {p.name}
                                </Badge>
                              ))}
                              {role.permissions.length === 0 && (
                                <span className="text-xs text-muted-foreground/40">No permissions</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
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
                                <TooltipContent side="left">Edit permissions</TooltipContent>
                              </Tooltip>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => initiateDelete(role.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[420px] p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 border-b border-border text-left">
              <DialogTitle className="text-lg font-bold">Create Role</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add a new role with specific permissions to your workspace.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
                <div className="p-4 space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Project Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="permission_ids"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Configure Permissions</FormLabel>
                        <div className="flex flex-col gap-2 border border-border p-3 rounded-lg max-h-48 overflow-y-auto">
                          {permissions.map((p) => {
                            const checked = field.value.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...field.value, p.id]);
                                    } else {
                                      field.onChange(field.value.filter((id) => id !== p.id));
                                    }
                                  }}
                                />
                                <span className="text-xs">{p.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRoleMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                    {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingRole} onOpenChange={(o) => !o && setEditingRole(null)}>
          <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[420px] p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 border-b border-border text-left">
              <DialogTitle className="text-lg font-bold">Edit Role</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update permissions assigned to this role.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateSubmit)}>
                <div className="p-4 space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Project Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="permission_ids"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Configure Permissions</FormLabel>
                        <div className="flex flex-col gap-2 border border-border p-3 rounded-lg max-h-48 overflow-y-auto">
                          {permissions.map((p) => {
                            const checked = field.value.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...field.value, p.id]);
                                    } else {
                                      field.onChange(field.value.filter((id) => id !== p.id));
                                    }
                                  }}
                                />
                                <span className="text-xs">{p.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditingRole(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateRoleMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                    {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
