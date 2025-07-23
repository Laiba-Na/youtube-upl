// utils/permissions.ts
import { Role } from "@prisma/client";

// Define which resources each role can access
export const rolePermissions = {
  [Role.ADMIN]: [
    "DASHBOARD", 
    "POST_CATALOG", 
    "POST_EDITING", 
    "ANALYTICS", 
    "CALENDAR", 
    "POST_MEDIA",
    "TEAM_SETUP",
    "SETTINGS"
  ],
  [Role.POST_SCHEDULER]: [
    "DASHBOARD",
    "POST_CATALOG", 
    "CALENDAR", 
    "POST_MEDIA"
  ],
  [Role.POST_CREATOR]: [
    "DASHBOARD",
    "POST_EDITING",
    "POST_CATALOG"
  ],
  [Role.ANALYTICS]: [
    "DASHBOARD",
    "ANALYTICS"
  ],
  [Role.MEMBER]: [
    "DASHBOARD", 
    "POST_CATALOG", 
    "POST_EDITING", 
    "ANALYTICS", 
    "CALENDAR", 
    "POST_MEDIA",
    "TEAM_SETUP",
    "SETTINGS"
  ]
};

// Check if a user with a specific role can access a resource
export function canAccess(role: Role, resource: string): boolean {
  return rolePermissions[role].includes(resource);
}

// Get all resources a role can access
export function getAccessibleResources(role: Role): string[] {
  return rolePermissions[role];
}