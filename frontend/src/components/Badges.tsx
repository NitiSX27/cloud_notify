export type TicketStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface StatusBadgeProps {
  status: TicketStatus | string;
}

interface PriorityBadgeProps {
  priority: TicketPriority | string;
}

const statusMap: Record<string, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const priorityMap: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = `badge badge-${status.toLowerCase().replace("_", "_")}`;
  return <span className={cls}>{statusMap[status] ?? status}</span>;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const cls = `badge badge-${priority.toLowerCase()}`;
  return (
    <span className={cls}>
      <span className={`priority-dot ${priority.toLowerCase()}`} />
      {priorityMap[priority] ?? priority}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const cls = `badge badge-${role.toLowerCase()}`;
  return <span className={cls}>{role}</span>;
}
