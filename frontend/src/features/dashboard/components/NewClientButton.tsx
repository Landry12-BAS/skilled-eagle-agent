"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NewClientModal } from "./NewClientModal";
import { Plus } from "lucide-react";
import { useNotifications } from "@/features/notifications/NotificationProvider";

export function NewClientButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { notify } = useNotifications();

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        New client
      </Button>

      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          notify("success", "Client created!", "The new client has been saved to your CRM.");
        }}
      />
    </>
  );
}
