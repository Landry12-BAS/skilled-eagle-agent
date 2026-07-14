"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getClients } from "@/lib/api-client";
import { ChevronRight, User, Building, Phone, Mail, Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export function ClientTable() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    async function fetchClients() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) { setError("Not authenticated"); return; }
        const data = await getClients(token);
        setClients(Array.isArray(data) ? data : (data.results || []));
      } catch {
        setError("Failed to load clients.");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter((c) => {
      const matchesSearch =
        !q ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  if (loading) {
    return (
      <div className="w-full mt-8 rounded-xl border border-black/10 bg-white overflow-hidden shadow-sm">
        <div className="p-6 space-y-4">
          <div className="h-6 w-32 bg-black/5 animate-pulse rounded-md" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full bg-black/5 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-8 p-6 rounded-xl border border-red-100 bg-red-50 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-8 rounded-xl border border-black/10 bg-white overflow-hidden shadow-sm">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-black/5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-black/10 bg-black/[0.02] focus:outline-none focus:ring-2 focus:ring-black/10 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-black/40 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="text-sm rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 transition"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Empty States */}
      {clients.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <User className="w-12 h-12 text-black/20 mb-4" />
          <h3 className="text-lg font-medium">No clients yet</h3>
          <p className="text-black/60 mt-1 max-w-sm">Get started by adding your first client using the "New client" button above.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <Search className="w-12 h-12 text-black/20 mb-4" />
          <h3 className="text-lg font-medium">No results found</h3>
          <p className="text-black/60 mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-black/60 uppercase bg-black/[0.02] border-b border-black/10">
              <tr>
                <th className="px-6 py-4 font-medium">Client Name</th>
                <th className="px-6 py-4 font-medium">Company</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <AnimatePresence mode="popLayout" initial={false}>
              <tbody>
                {filtered.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="border-b border-black/5 hover:bg-black/[0.01] transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium">{client.first_name} {client.last_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-black/70">
                        <Building className="w-3.5 h-3.5" />
                        {client.company || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-black/70">
                        <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{client.email}</div>
                        {client.phone && <div className="flex items-center gap-2 text-xs"><Phone className="w-3.5 h-3.5" />{client.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${client.status === "active" ? "bg-green-100 text-green-700 border border-green-200" : "bg-black/10 text-black/70"}`}>
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <button className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-black/5 text-black/40 hover:text-black transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </AnimatePresence>
          </table>
          <div className="px-6 py-3 text-xs text-black/40 border-t border-black/5">
            Showing {filtered.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
