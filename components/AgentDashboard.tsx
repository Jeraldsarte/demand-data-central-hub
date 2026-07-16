"use client";

import React from 'react';
import { Activity, Users, Database, ShieldAlert } from 'lucide-react';

export default function AgentDashboard() {
  const stats = [
    { 
      title: 'Active Agents', 
      value: '1,234', 
      color: 'text-green-700 dark:text-green-400', 
      icon: <Users className="w-6 h-6" /> 
    },
    { 
      title: 'System Status', 
      value: 'Healthy', 
      color: 'text-blue-700 dark:text-blue-400', 
      icon: <Activity className="w-6 h-6" /> 
    },
    { 
      title: 'Database Queries', 
      value: '8,432', 
      color: 'text-yellow-700 dark:text-yellow-400', 
      icon: <Database className="w-6 h-6" /> 
    },
    { 
      title: 'Security Alerts', 
      value: '0', 
      color: 'text-red-700 dark:text-red-400', 
      icon: <ShieldAlert className="w-6 h-6" /> 
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Demand Data Central Hub</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 font-medium">{stat.title}</h3>
              <div className={`${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}