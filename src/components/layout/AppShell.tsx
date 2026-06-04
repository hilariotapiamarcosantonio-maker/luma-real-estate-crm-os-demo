"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({
  children,
  isConnected = true,
}: {
  children: React.ReactNode;
  isConnected?: boolean;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-crm-bg text-crm-text">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!isConnected && (
          <div className="bg-crm-amber/10 border-b border-crm-amber/20 text-crm-amber px-4 py-2 text-center text-xs font-semibold tracking-wide">
            ⚠️ Modo demo local: los datos no se están enviando a una Sheet.
          </div>
        )}
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-crm-bg p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
