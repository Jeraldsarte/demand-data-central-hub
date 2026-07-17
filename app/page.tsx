import AgentDashboard from "@/components/AgentDashboard";
import ManagerDashboard from "@/components/ManagerDashboard";
import AuthButton from "@/components/AuthButton";
import { getTasks } from "@/app/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ADMIN_EMAILS = [
  "jeraldagbonsarte25@gmail.com",
  "jerald@outdoorequipped.com"
];

export default async function Home() {
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

  const userEmail = String(session.user?.email || "").toLowerCase().trim();
  const userName = String(session.user?.name || "Guest");
  const isAdmin = ADMIN_EMAILS.map(email => email.toLowerCase().trim()).includes(userEmail);

  const rawTasks = await getTasks();
  const safeTasks = JSON.parse(JSON.stringify(rawTasks || []));

  const userEmailPrefix = userEmail.split("@")[0];
  const finalTasks = isAdmin 
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
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight text-gray-400">
          Demand Data Central Hub
        </h1>
        <AuthButton />
      </div>

      {isAdmin ? (
        <ManagerDashboard initialTasks={finalTasks} currentUser={userName} />
      ) : (
        <AgentDashboard initialTasks={finalTasks} currentUser={userName} isAdmin={false} />
      )}
    </main>
  );
}