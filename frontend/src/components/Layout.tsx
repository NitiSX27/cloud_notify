import { type ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export default function Layout({ children, title, actions }: LayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {(title || actions) && (
          <div className="topbar">
            <div className="topbar-title">{title}</div>
            <div className="topbar-actions">{actions}</div>
          </div>
        )}
        <div className="page-content fade-in">{children}</div>
      </main>
    </div>
  );
}
