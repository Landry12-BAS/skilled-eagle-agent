"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/api-client";
import { User, Building, Phone, Mail, ArrowLeft, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

type Client = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  created_at: string;
};

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchClient() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          router.push("/login");
          return;
        }
        if (!params.id) return;
        
        const data = await getClient(params.id as string, token);
        setClient(data);
      } catch (err) {
        setError("Failed to load client details.");
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10 animate-pulse">
        <div className="h-8 w-24 bg-black/5 rounded mb-8" />
        <div className="bg-white border border-black/10 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-black/5" />
            <div className="space-y-3">
              <div className="h-8 w-48 bg-black/5 rounded" />
              <div className="h-4 w-32 bg-black/5 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-black/5">
            <div className="h-16 bg-black/5 rounded-xl" />
            <div className="h-16 bg-black/5 rounded-xl" />
            <div className="h-16 bg-black/5 rounded-xl" />
            <div className="h-16 bg-black/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link href="/dashboard">
          <Button variant="outline" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="p-6 rounded-xl border border-red-100 bg-red-50 text-red-600">
          <p>{error || "Client not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link href="/dashboard">
        <button className="flex items-center gap-2 text-sm font-medium text-black/60 hover:text-black mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </Link>

      <div className="bg-white border border-black/10 rounded-[2rem] overflow-hidden shadow-sm">
        {/* Header Section */}
        <div className="bg-black/[0.02] border-b border-black/10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-black/5 shadow-inner">
              <span className="text-3xl font-bold text-black/40">
                {client.first_name.charAt(0)}{client.last_name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {client.first_name} {client.last_name}
              </h1>
              <p className="text-black/60 mt-1 flex items-center gap-2">
                <Building className="w-4 h-4" />
                {client.company || "No Company Specified"}
              </p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
            client.status === 'active' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-black/10 text-black/70'
          }`}>
            <Activity className="w-4 h-4" />
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </div>
        </div>

        {/* Details Section */}
        <div className="p-8 md:p-10">
          <h3 className="text-lg font-semibold mb-6">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/5">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 text-black/60" />
              </div>
              <div>
                <p className="text-xs text-black/60 uppercase font-medium">Email Address</p>
                <p className="font-medium mt-0.5">{client.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/5">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Phone className="w-5 h-5 text-black/60" />
              </div>
              <div>
                <p className="text-xs text-black/60 uppercase font-medium">Phone Number</p>
                <p className="font-medium mt-0.5">{client.phone || "Not provided"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/5">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-black/60" />
              </div>
              <div>
                <p className="text-xs text-black/60 uppercase font-medium">Client ID</p>
                <p className="font-medium mt-0.5">#{client.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/5">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-black/60" />
              </div>
              <div>
                <p className="text-xs text-black/60 uppercase font-medium">Created On</p>
                <p className="font-medium mt-0.5">
                  {client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
