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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Search, Eye, EyeOff } from "lucide-react";
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

interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_staff: boolean;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  roles: Role[];
}

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().optional(),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  is_staff: z.boolean(),
  role_ids: z.array(z.string()).min(1, "At least one role must be assigned"),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { confirmDelete } = useDeleteConfirmation();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Change Password Modal States
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => clientApi.get("users").json(),
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => clientApi.get("roles").json(),
  });

  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      is_active: true,
      is_superuser: false,
      is_staff: false,
      role_ids: [],
    },
  });

  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      is_active: true,
      is_superuser: false,
      is_staff: false,
      role_ids: [],
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (values: UserFormValues) => clientApi.post("users", { json: values }).json(),
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsAddOpen(false);
      createForm.reset();
    },
    onError: (err) => {
      handleApiError(err, createForm as never);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) => clientApi.put(`users/${id}`, { json: values }).json(),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      editForm.reset();
    },
    onError: (err) => {
      handleApiError(err, editForm as never);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => clientApi.post(`users/${id}/confirm-delete`, { json: { password } }).json(),
    onSuccess: () => {
      toast.success("User removed successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      handleApiError(err);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ id, admin_password, new_password }: { id: string; admin_password: string; new_password: string }) =>
      clientApi.post(`users/${id}/change-password`, { json: { admin_password, new_password } }).json(),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setChangingPasswordUser(null);
      setAdminPassword("");
      setNewPassword("");
    },
    onError: (err) => {
      handleApiError(err);
    },
  });

  const handleCreateSubmit = React.useCallback((values: UserFormValues) => {
    createUserMutation.mutate(values);
  }, [createUserMutation]);

  const handleUpdateSubmit = React.useCallback((values: UserFormValues) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, values });
    }
  }, [editingUser, updateUserMutation]);

  const initiateDelete = React.useCallback((id: string) => {
    confirmDelete(async (password: string) => {
      await deleteUserMutation.mutateAsync({ id, password });
    });
  }, [confirmDelete, deleteUserMutation]);

  const openEdit = React.useCallback((user: User) => {
    setEditingUser(user);
    editForm.reset({
      email: user.email,
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      is_active: user.is_active,
      is_superuser: user.is_superuser,
      is_staff: user.is_staff || false,
      role_ids: user.roles.map((r) => r.id),
    });
  }, [editForm]);

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingPasswordUser || !adminPassword || !newPassword) return;
    changePasswordMutation.mutate({
      id: changingPasswordUser.id,
      admin_password: adminPassword,
      new_password: newPassword,
    });
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.first_name && u.first_name.toLowerCase().includes(search.toLowerCase())) ||
      (u.last_name && u.last_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 font-sans">
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: users.length, color: "text-indigo-400" },
          { label: "Superusers", value: users.filter((u) => u.is_superuser).length, color: "text-green-600" },
          { label: "Staff Members", value: users.filter((u) => u.is_staff).length, color: "text-violet-400" },
          { label: "Active", value: users.filter((u) => u.is_active).length, color: "text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border text-foreground">
            <CardContent className="p-4 text-left">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border text-foreground">
        <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
          <div className="text-left">
            <CardTitle className="text-base">All Members</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""} configured
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
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-semibold pl-4">Member</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">Roles</TableHead>
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
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-indigo-600/20 text-indigo-400">
                            {user.first_name ? user.first_name.slice(0, 2).toUpperCase() : "US"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground leading-none">
                            <span>{user.first_name} {user.last_name}</span>
                            {user.is_superuser && (
                              <span className="text-[9px] font-bold text-green-600 bg-green-600/10 px-1.5 py-0.5 rounded">
                                Superuser
                              </span>
                            )}
                            {user.is_staff && (
                              <span className="text-[9px] font-bold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded">
                                Staff
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <Badge key={r.id} variant="outline" className="text-[10px]">
                            {r.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] capitalize font-semibold border", user.is_active ? "bg-green-600/10 text-green-600 border-green-600/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}
                      >
                        {user.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground w-40">
                          <DropdownMenuItem
                            onClick={() => openEdit(user)}
                            className="text-xs gap-2 cursor-pointer hover:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setChangingPasswordUser(user)}
                            className="text-xs gap-2 cursor-pointer hover:bg-muted"
                          >
                            <span className="h-3.5 w-3.5 flex items-center justify-center font-bold">🔑</span>
                            Change Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            onClick={() => initiateDelete(user.id)}
                            className="text-xs gap-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer focus:text-rose-400 focus:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[500px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border text-left">
            <DialogTitle className="text-lg font-bold">Add Team Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new member to your workspace team.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit as never)}>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control as never}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control as never}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control as never}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@worklyn.dev" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={createForm.control as never}
                  name="password"
                  render={({ field }) => {
                    const [showPassword, setShowPassword] = useState(false);
                    return (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={createForm.control as never}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control as never}
                  name="role_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Roles</FormLabel>
                      <div className="flex flex-col gap-2 border border-border p-3 rounded-lg max-h-36 overflow-y-auto">
                        {roles.map((r) => {
                          const checked = field.value.includes(r.id);
                          return (
                            <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(isChecked) => {
                                  if (isChecked) {
                                    field.onChange([...field.value, r.id]);
                                  } else {
                                    field.onChange(field.value.filter((id: string) => id !== r.id));
                                  }
                                }}
                              />
                              <span className="text-xs">{r.name}</span>
                            </label>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-3 border border-border p-3 rounded-lg">
                  <FormField
                    control={createForm.control as never}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel className="text-xs font-semibold">Account Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control as never}
                    name="is_staff"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel className="text-xs font-semibold">Staff Member</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control as never}
                    name="is_superuser"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel className="text-xs font-semibold">Superuser</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                  {createUserMutation.isPending ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[500px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border text-left">
            <DialogTitle className="text-lg font-bold">Edit Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update team member profile details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateSubmit as never)}>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control as never}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control as never}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control as never}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@worklyn.dev" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control as never}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control as never}
                  name="role_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Roles</FormLabel>
                      <div className="flex flex-col gap-2 border border-border p-3 rounded-lg max-h-36 overflow-y-auto">
                        {roles.map((r) => {
                          const checked = field.value.includes(r.id);
                          return (
                            <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(isChecked) => {
                                  if (isChecked) {
                                    field.onChange([...field.value, r.id]);
                                  } else {
                                    field.onChange(field.value.filter((id: string) => id !== r.id));
                                  }
                                }}
                              />
                              <span className="text-xs">{r.name}</span>
                            </label>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-3 border border-border p-3 rounded-lg">
                  <FormField
                    control={editForm.control as never}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel className="text-xs font-semibold">Account Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control as never}
                    name="is_staff"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel className="text-xs font-semibold">Staff Member</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control as never}
                    name="is_superuser"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel className="text-xs font-semibold">Superuser</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!changingPasswordUser} onOpenChange={(o) => {
        if (!o) {
          setChangingPasswordUser(null);
          setShowAdminPassword(false);
          setShowNewPassword(false);
        }
      }}>
        <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[400px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border text-left">
            <DialogTitle className="text-lg font-bold">Change Password</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Verify your administrator credentials and set a new password for {changingPasswordUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePasswordSubmit}>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="adminPassword">Your Admin Password</Label>
                <div className="relative">
                  <Input
                    id="adminPassword"
                    type={showAdminPassword ? "text" : "password"}
                    placeholder="Confirm your credentials"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                  >
                    {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <Label htmlFor="newPassword">New User Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setChangingPasswordUser(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer">
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
