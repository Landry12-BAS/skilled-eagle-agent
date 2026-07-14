"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const backendOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api").replace(/\/api\/?$/, "");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const profileImageUrl = user.profile_picture
    ? user.profile_picture.startsWith("http")
      ? user.profile_picture
      : `${backendOrigin}${user.profile_picture.startsWith("/") ? "" : "/"}${user.profile_picture}`
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Welcome, {user.first_name || user.username}</h1>
            <p className="text-slate-600 mt-1">Manage your account and settings</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </header>

        {/* Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">Profile Information</h2>
            {profileImageUrl && (
              <div className="mb-6">
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover border border-slate-200"
                />
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">First Name</p>
                  <p className="text-lg text-slate-900">{user.first_name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Last Name</p>
                  <p className="text-lg text-slate-900">{user.last_name || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Email</p>
                <p className="text-lg text-slate-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Username</p>
                <p className="text-lg text-slate-900">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Bio</p>
                <p className="text-lg text-slate-900">{user.bio || "No bio added yet"}</p>
              </div>
            </div>
          </div>

          {/* Role & Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900">Account Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Role</p>
                <div className="mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Status</p>
                <div className="mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {user.is_active ? "Active" : "Inactive"}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Staff Access</p>
                <div className="mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                  {user.is_staff ? "Yes" : "No"}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Member Since</p>
                <p className="text-sm text-slate-900 mt-1">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Quick Actions</h3>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => router.push("/chat")} className="gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
              Open AI Chat
            </Button>
            <Button onClick={() => router.push("/profile/edit")} variant="outline">
              Edit Profile
            </Button>
            <Button onClick={() => router.push("/settings")} variant="outline">
              Settings
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
