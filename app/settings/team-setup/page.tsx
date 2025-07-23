'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { Eye, EyeOff, X } from 'lucide-react';

export default function TeamSetup() {
  const { data: session } = useSession();
  interface TeamMembership {
    team: {
      id: string;
      name: string;
      description: string;
    };
    role: Role;
  }
  
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [invitation, setInvitation] = useState({ email: '', role: 'POST_CREATOR', password: '' });
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const res = await fetch('/api/teams');
    const data = await res.json();
    setTeams(data);
    
    if (data.length > 0) {
      setSelectedTeam(data[0].team.id);
    }
  };

  const createTeam = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeam)
    });
    
    if (res.ok) {
      setNewTeam({ name: '', description: '' });
      fetchTeams();
    }
  };

  const inviteMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    
    const res = await fetch(`/api/teams/${selectedTeam}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invitation)
    });
    
    if (res.ok) {
      setInvitation({ email: '', role: 'POST_CREATOR', password: '' });
      fetchTeams();
    }
  };

  const clearPassword = () => {
    setInvitation({ ...invitation, password: '' });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Team Setup</h1>
      
      {/* Create Team Form */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
        <form onSubmit={createTeam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Name</label>
            <input
              type="text"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newTeam.description}
              onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Team
          </button>
        </form>
      </div>
      
      {/* Invite Members Form */}
      {teams.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Invite Team Member</h2>
          <form onSubmit={inviteMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {teams.map((membership) => (
                  <option key={membership.team.id} value={membership.team.id}>
                    {membership.team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={invitation.email}
                onChange={(e) => setInvitation({ ...invitation, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={invitation.password}
                  onChange={(e) => setInvitation({ ...invitation, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pr-20"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
                  {invitation.password && (
                    <button
                      type="button"
                      onClick={clearPassword}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={invitation.role}
                onChange={(e) => setInvitation({ ...invitation, role: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="POST_SCHEDULER">Post Scheduler</option>
                <option value="POST_CREATOR">Post Creator</option>
                <option value="ANALYTICS">Analytics</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Invite Member
            </button>
          </form>
        </div>
      )}
      
      {/* Team Members List */}
      {teams.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Teams</h2>
          <div className="space-y-6">
            {teams.map((membership) => (
              <div key={membership.team.id} className="border-b pb-4">
                <h3 className="text-lg font-medium">{membership.team.name}</h3>
                <p className="text-gray-500">{membership.team.description}</p>
                <p className="text-sm mt-2">
                  Your role: <span className="font-semibold">{membership.role}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}