"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/lib/auth-client";

export default function EditProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, accessToken } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    if (!accessToken) {
      setSaving(false);
      setError("You need to sign in again.");
      return;
    }

    const formData = new FormData();
    formData.append("first_name", firstName.trim());
    formData.append("last_name", lastName.trim());
    formData.append("bio", bio.trim());
    if (profileImage) {
      formData.append("profile_picture", profileImage);
    }

    const updatedUser = await updateProfile(accessToken, formData);

    if (!updatedUser) {
      setSaving(false);
      setError("Failed to update profile.");
      return;
    }

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setSaving(false);
    setProfileImage(null);
    setMessage("Profile updated successfully.");
  };

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="profileImage" className="block text-sm font-medium text-slate-700 mb-2">
              Profile Image
            </label>
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files?.[0] ?? null)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {user.profile_picture && !profileImage && (
              <p className="text-xs text-slate-600 mt-2">Current image is set.</p>
            )}
            {profileImage && (
              <p className="text-xs text-slate-600 mt-2">Selected: {profileImage.name}</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
