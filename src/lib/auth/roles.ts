export type Role = "admin" | "editor" | "viewer";

export type Permission =
  | "customer:read"
  | "customer:write"
  | "customer:delete"
  | "user:manage";

const MATRIX: Record<Role, Permission[]> = {
  viewer: ["customer:read"],
  editor: ["customer:read", "customer:write"],
  admin: ["customer:read", "customer:write", "customer:delete", "user:manage"],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}
