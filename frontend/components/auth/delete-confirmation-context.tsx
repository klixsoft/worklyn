"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteConfirmationContextType {
  confirmDelete: (onConfirm: (password: string) => Promise<void>) => void;
}

const DeleteConfirmationContext = React.createContext<DeleteConfirmationContextType | null>(null);

export function useDeleteConfirmation() {
  const context = React.useContext(DeleteConfirmationContext);
  if (!context) {
    throw new Error("useDeleteConfirmation must be used within a DeleteConfirmationProvider");
  }
  return context;
}

export function DeleteConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [pendingConfirm, setPendingConfirm] = React.useState<((password: string) => Promise<void>) | null>(null);
  const [loading, setLoading] = React.useState(false);

  const confirmDelete = React.useCallback((onConfirm: (password: string) => Promise<void>) => {
    setPendingConfirm(() => onConfirm);
    setPassword("");
    setOpen(true);
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (pendingConfirm) {
      setLoading(true);
      try {
        await pendingConfirm(password);
        setOpen(false);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }, [pendingConfirm, password]);

  return (
    <DeleteConfirmationContext.Provider value={{ confirmDelete }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              This is a destructive action. Please verify your identity by entering your password to authorize this request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={!password || loading}>
              {loading ? "Verifying..." : "Confirm & Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DeleteConfirmationContext.Provider>
  );
}
