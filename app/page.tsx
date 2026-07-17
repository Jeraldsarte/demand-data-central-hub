import AgentDashboard from "../components/AgentDashboard";
import ManagerDashboard from "../components/ManagerDashboard";
import AuthButton from "../components/AuthButton";
import { getTasks } from "./actions";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Link from "next/link";

// 1. HARDCODED ROLES CONFIGURATION
const ADMIN_EMAILS = [
  "jeraldagbonsarte25@gmail.com",
  "jerald@outdoorequipped.com"
];

const MANAGER_EMAILS = [
  "jhaye@outdoorequipped.com"
  // Add other manager emails here as your team grows
];

interface PageProps {
  searchParams: Promise<{ view?: string }> | { view?: string };
}

export default async function Home({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Demand Data Hub</h1>
          <AuthButton />
        </div>
      </main>
    );
  }

  // Resolve searchParams cleanly (handles async signature variants safely)
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;

  // 2. IDENTITY AND ROLE CHECKING
  const userEmail = String(session.user?.email || "").toLowerCase().trim();
  const userName = String(session.user?.name || "Guest");
  
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail);
  const isManager = MANAGER_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail);

  // 3. DETERMINING THE VISUAL INTERFACE
  let targetView: "manager" | "agent" = "agent";

  if (isAdmin) {
    // Admins default to manager dashboard, but can pass ?view=agent to drop down
    targetView = resolvedParams?.view === "agent" ? "agent" : "manager";
  } else if (isManager) {
    // Managers are permanently routed to the management board
    targetView = "manager";
  } else {
    // All other authenticated company emails default strictly to Agent view
    targetView = "agent";
  }

  // 4. DATA FETCHING & FILTERING
  const rawTasks = await getTasks();
  const safeTasks = JSON.parse(JSON.stringify(rawTasks || []));

  const userEmailPrefix = userEmail.split("@")[0];
  
  // Filter logic hinges entirely on the active view, not just the raw role tier
  const finalTasks = targetView === "manager"
    ? safeTasks 
    : safeTasks.filter((t: any) => {
        const taskAgent = String(t.agent || "").toLowerCase().trim();
        return (
          taskAgent === userName.toLowerCase().trim() || 
          taskAgent === userEmailPrefix
        );
      });

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Dynamic Navigation Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-tight">
            Demand Data Central Hub
          </h1>
          
          {/* Admin Control Switcher Overlay */}
          {isAdmin && (
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg text-xs font-medium">
              <Link 
                href="/" 
                className={`px-3 py-1.5 rounded-md transition-all ${targetView === 'manager' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500'}`}
              >
                Manager View
              </Link>
              <Link 
                href="/?view=agent" 
                className={`px-3 py-1.5 rounded-md transition-all ${targetView === 'agent' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500'}`}
              >
                Agent View
              </Link>
            </div>
          )}
        </div>
        <AuthButton />
      </div>

      {/* 5. CONDITIONALLY RENDERING TARGET INTERFACE */}
      {targetView === "manager" ? (
        <ManagerDashboard initialTasks={finalTasks} currentUser={userName} />
      ) : (
        <AgentDashboard initialTasks={finalTasks} currentUser={userName} isAdmin={isAdmin || isManager} />
      )}
    </main>
  );
}