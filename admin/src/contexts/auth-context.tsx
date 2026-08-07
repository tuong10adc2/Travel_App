"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/lib/types";

const STAFF_ROLES: UserRole[] = ["admin", "content_editor", "support"];

interface AuthContextValue {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  isStaff: boolean;
  role: UserRole | null;
  can: {
    manageUsers: boolean; // admin, support
    manageContent: boolean; // admin, content_editor (places, tours, media360, featured)
    moderateReviews: boolean; // admin, support
    manageRoles: boolean; // admin only
  };
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setProfile(null);
        setProfileLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...(snap.data() as Omit<AppUser, "uid">) });
        } else {
          setProfile(null);
        }
        setProfileLoading(false);
      },
      () => {
        setProfile(null);
        setProfileLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const value = useMemo<AuthContextValue>(() => {
    const role = profile?.role ?? null;
    const isStaff = !!role && STAFF_ROLES.includes(role) && !profile?.isDisabled;
    return {
      user,
      profile,
      loading: authLoading || profileLoading,
      isStaff,
      role,
      can: {
        manageUsers: role === "admin" || role === "support",
        manageContent: role === "admin" || role === "content_editor",
        moderateReviews: role === "admin" || role === "support",
        manageRoles: role === "admin",
      },
      signOut: () => firebaseSignOut(auth),
    };
  }, [user, profile, authLoading, profileLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
