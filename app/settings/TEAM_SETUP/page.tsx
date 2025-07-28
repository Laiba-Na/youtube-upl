'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useDarkMode } from '@/app/DarkModeContext';
import { Role } from '@prisma/client';
import { Eye, EyeOff, X, Menu } from 'lucide-react';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Team {
  id: string;
  name: string;
  description: string;
}

interface TeamMembership {
  team: Team;
  role: Role;
}

interface Invitation {
  email: string;
  role: Role;
  password: string;
}

export default function TeamSetup() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [invitation, setInvitation] = useState<Invitation>({ email: '', role: 'POST_CREATOR' as Role, password: '' });
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teams', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch teams');
      }
      const data: TeamMembership[] = await res.json();
      setTeams(data);
      if (data.length > 0) {
        setSelectedTeam(data[0].team.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create team');
      }
      setNewTeam({ name: '', description: '' });
      toast.success('Team created successfully!');
      fetchTeams();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inviteMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }
    if (!invitation.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitation.email)) {
      toast.error('Invalid email format');
      return;
    }
    if (!invitation.password.trim()) {
      toast.error('Password is required');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeam}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitation),
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to invite member');
      }
      setInvitation({ email: '', role: 'POST_CREATOR' as Role, password: '' });
      toast.success('Invitation sent successfully!');
      fetchTeams();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearPassword = () => {
    setInvitation({ ...invitation, password: '' });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <Toaster position="top-right" />
      <TopBar />
      <div className="flex">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <button
          className={`lg:hidden fixed top-4 right-4 z-50 p-2 text-white bg-primaryPurple rounded-full hover:bg-highlightBlue transition-all duration-200 ${
            isSidebarOpen ? 'hidden' : 'block'
          }`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-textBlack dark:text-white mb-6">
              Team Setup
            </h1>

            {isLoading && (
              <div className="flex justify-center mb-6">
                <LoadingSpinner size="lg" className="text-primaryPurple" />
              </div>
            )}

            {/* Create Team Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-8">
              <h2 className="text-xl font-semibold text-textBlack dark:text-white mb-4">
                Create New Team
              </h2>
              <form onSubmit={createTeam} className="space-y-4">
                <div>
                  <label
                    htmlFor="teamName"
                    className="block text-sm font-medium text-textBlack dark:text-gray-200"
                  >
                    Team Name <span className="text-primaryRed">*</span>
                  </label>
                  <input
                    id="teamName"
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue p-2"
                    required
                    aria-required="true"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="teamDescription"
                    className="block text-sm font-medium text-textBlack dark:text-gray-200"
                  >
                    Description
                  </label>
                  <textarea
                    id="teamDescription"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue p-2"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlightBlue disabled:bg-primaryPurple/50 transition-all duration-200"
                  aria-label="Create team"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2 text-white" />
                      Creating...
                    </span>
                  ) : (
                    'Create Team'
                  )}
                </button>
              </form>
            </div>

            {/* Invite Members Form */}
            {teams.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-8">
                <h2 className="text-xl font-semibold text-textBlack dark:text-white mb-4">
                  Invite Team Member
                </h2>
                <form onSubmit={inviteMember} className="space-y-4">
                  <div>
                    <label
                      htmlFor="selectTeam"
                      className="block text-sm font-medium text-textBlack dark:text-gray-200"
                    >
                      Select Team <span className="text-primaryRed">*</span>
                    </label>
                    <select
                      id="selectTeam"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue p-2"
                      disabled={isLoading}
                      required
                      aria-required="true"
                    >
                      {teams.map((membership) => (
                        <option key={membership.team.id} value={membership.team.id}>
                          {membership.team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="inviteEmail"
                      className="block text-sm font-medium text-textBlack dark:text-gray-200"
                    >
                      Email <span className="text-primaryRed">*</span>
                    </label>
                    <input
                      id="inviteEmail"
                      type="email"
                      value={invitation.email}
                      onChange={(e) => setInvitation({ ...invitation, email: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue p-2"
                      required
                      aria-required="true"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="invitePassword"
                      className="block text-sm font-medium text-textBlack dark:text-gray-200"
                    >
                      Password <span className="text-primaryRed">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="invitePassword"
                        type={showPassword ? 'text' : 'password'}
                        value={invitation.password}
                        onChange={(e) => setInvitation({ ...invitation, password: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue p-2 pr-20"
                        required
                        aria-required="true"
                        disabled={isLoading}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
                        {invitation.password && (
                          <button
                            type="button"
                            onClick={clearPassword}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label="Clear password"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="inviteRole"
                      className="block text-sm font-medium text-textBlack dark:text-gray-200"
                    >
                      Role <span className="text-primaryRed">*</span>
                    </label>
                    <select
                      id="inviteRole"
                      value={invitation.role}
                      onChange={(e) => setInvitation({ ...invitation, role: e.target.value as Role })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue p-2"
                      disabled={isLoading}
                      required
                      aria-required="true"
                    >
                      <option value="POST_SCHEDULER">Post Scheduler</option>
                      <option value="POST_CREATOR">Post Creator</option>
                      <option value="ANALYTICS">Analytics</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlightBlue disabled:bg-primaryPurple/50 transition-all duration-200"
                    aria-label="Invite member"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <LoadingSpinner size="sm" className="mr-2 text-white" />
                        Inviting...
                      </span>
                    ) : (
                      'Invite Member'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Team Members List */}
            {teams.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-textBlack dark:text-white mb-4">
                  Your Teams
                </h2>
                <div className="space-y-6">
                  {teams.map((membership) => (
                    <div key={membership.team.id} className="border-b border-gray-300 dark:border-gray-600 pb-4">
                      <h3 className="text-lg font-medium text-textBlack dark:text-white">{membership.team.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{membership.team.description || 'No description'}</p>
                      <p className="text-sm mt-2 text-textBlack dark:text-gray-200">
                        Your role: <span className="font-semibold">{membership.role}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}