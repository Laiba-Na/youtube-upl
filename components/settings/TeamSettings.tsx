"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
}

const mockTeam: TeamMember[] = [
  {
    id: "1",
    name: "Maryam Shabir",
    email: "maryam@example.com",
    role: "ADMIN",
  },
  {
    id: "2",
    name: "Ali Khan",
    email: "ali@example.com",
    role: "EDITOR",
  },
];

export default function TeamSettings() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const router = useRouter();

  useEffect(() => {
    // Fetch team members from API later
    setTeamMembers(mockTeam);
  }, []);

  const handleInvite = () => {
    // Send invite request via API
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: "Pending...",
      email,
      role,
    };
    setTeamMembers([...teamMembers, newMember]);
    setEmail("");
    alert("Invite sent!");
    // TODO: Add API to actually invite
  };

  const handleRemove = (id: string) => {
    if (confirm("Remove this team member?")) {
      setTeamMembers(teamMembers.filter((m) => m.id !== id));
      // TODO: API call to remove member
    }
  };

  const handleTeamSetup = () => {
    router.push("/team-setup");
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Team Settings</h2>

      {/* Invite Form */}
      <div className="mb-6 max-w-xl space-y-3">
        <p className="font-medium">Invite New Member</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter email address"
          className="w-full border p-2 rounded"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full border p-2 rounded"
        >
          <option value="EDITOR">Editor</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <div className="space-y-2">
          <button
            onClick={handleInvite}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Send Invite
          </button>
          <button
            onClick={handleTeamSetup}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Team Setup
          </button>
        </div>
      </div>

      {/* Team List */}
      <div className="space-y-4">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="flex justify-between items-center border p-4 rounded"
          >
            <div>
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-gray-500">{member.email}</p>
              <p className="text-xs text-gray-400 capitalize">
                Role: {member.role.toLowerCase()}
              </p>
            </div>
            {member.role !== "ADMIN" && (
              <button
                onClick={() => handleRemove(member.id)}
                className="text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
