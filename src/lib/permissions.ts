export type Permission = 'order_entry' | 'purchase_entry' | 'sales_entry' | 'system_admin';

export type RoleCode = 'admin' | 'order_entry' | 'purchase_entry' | 'sales_entry' | 'viewer';

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  roleCode: RoleCode | string;
  roleLabel: string;
  permissions: Permission[];
}

export const ROLE_PERMISSIONS: Record<RoleCode, Permission[]> = {
  admin: ['order_entry', 'purchase_entry', 'sales_entry', 'system_admin'],
  order_entry: ['order_entry'],
  purchase_entry: ['purchase_entry'],
  sales_entry: ['sales_entry'],
  viewer: [],
};

export const ROLE_LABELS: Record<RoleCode, string> = {
  admin: '管理员',
  order_entry: '订单录入员',
  purchase_entry: '采购录入员',
  sales_entry: '销售录入员',
  viewer: '查看员',
};

export function getRolePermissions(roleCode: string): Permission[] {
  return [...(ROLE_PERMISSIONS[roleCode as RoleCode] || [])];
}

export function hasPermission(user: Pick<AuthUser, 'roleCode' | 'permissions'> | null, permission: Permission) {
  if (!user) return false;
  return user.permissions.includes(permission) || getRolePermissions(user.roleCode).includes(permission);
}

export function normalizeUser(raw: {
  id: number;
  username: string;
  display_name: string;
  role_code: string;
  role_label?: string;
  permissions?: string[];
}): AuthUser {
  const roleCode = raw.role_code as RoleCode;
  return {
    id: raw.id,
    username: raw.username,
    displayName: raw.display_name,
    roleCode,
    roleLabel: raw.role_label || ROLE_LABELS[roleCode] || raw.role_code,
    permissions: (raw.permissions || getRolePermissions(raw.role_code)) as Permission[],
  };
}
