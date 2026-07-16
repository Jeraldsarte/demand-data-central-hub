import AgentDashboard from "@/components/AgentDashboard";
import AuthButton from "@/components/AuthButton";
import { getTasks } from "@/app/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ADMIN_EMAILS = [
  "jeraldagbonsarte25@gmail.com",
  "jhaye@outdoorequipped.com"
];

export default async function Home() {
  // Pass authOptions here! This stops the ArrayBuffer memory leak crash.
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

  // Strictly force these to be standard strings
  const userEmail = String(session.user?.email || "");
  const userName = String(session.user?.name || "Guest");
  const isAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase().trim());

  const rawTasks = await getTasks();
  const safeTasks = JSON.parse(JSON.stringify(rawTasks || []));

  const finalTasks = isAdmin 
    ? safeTasks 
    : safeTasks.filter((t: any) => t.agent?.toLowerCase().trim() === userName.toLowerCase().trim());

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-7xl mx-auto mb-6 flex justify-end">
        <AuthButton />
      </div>
      <AgentDashboard 
        initialTasks={finalTasks} 
        currentUser={userName}
        isAdmin={isAdmin} 
      />
    </main>
  );
}