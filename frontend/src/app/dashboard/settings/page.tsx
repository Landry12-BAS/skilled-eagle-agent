"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Lock, User, Loader2, CheckCircle } from "lucide-react";
import { useNotifications } from "@/features/notifications/NotificationProvider";
import { getCurrentUser, updateProfile } from "@/lib/auth-client";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000/api";

export default function SettingsPage() {
  const { notify } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
    role: "",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new_password: "",
    confirm: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser(token)
      .then((data) => {
        if (data) {
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            bio: data.bio || "",
            role: data.role || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token");
      const data = await updateProfile(token, {
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
      });
      if (!data) throw new Error();
      notify("success", "Profile updated!", "Your changes have been saved.");
    } catch {
      notify("error", "Failed to update profile", "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      notify("error", "Passwords don't match", "Please confirm your new password correctly.");
      return;
    }
    setChangingPassword(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token");
      const data = await updateProfile(token, { password: passwords.new_password });
      if (!data) throw new Error();
      setPasswords({ current: "", new_password: "", confirm: "" });
      notify("success", "Password changed!", "Your new password is now active.");
    } catch {
      notify("error", "Failed to change password", "Please try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/dashboard">
        <button className="flex items-center gap-2 text-sm font-medium text-black/60 hover:text-black mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </Link>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Account Settings</h1>
      <p className="text-black/50 mb-10">Manage your profile and security preferences.</p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-black/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-sm text-black/40">{profile.email}</div>

          {/* Profile Form */}
          <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                <User className="w-5 h-5 text-black/50" />
              </div>
              <h2 className="text-lg font-semibold">Profile Information</h2>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-black/60 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profile.first_name}
                    onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-black/[0.02]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/60 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profile.last_name}
                    onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-black/[0.02]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-black/60 mb-1">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  placeholder="Tell us a bit about yourself..."
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-black/[0.02] resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Password Form */}
          <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                <Lock className="w-5 h-5 text-black/50" />
              </div>
              <h2 className="text-lg font-semibold">Change Password</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black/60 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-black/[0.02]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-black/60 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-black/[0.02]"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-60 transition-colors"
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
