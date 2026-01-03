export interface AppData {
  id: string;
  name: string;
  logo: string;
  url: string;
  username: string;
  password?: string;
  lastUsed?: string;
  category?: string;
  authType?: 'none' | 'user_provided' | 'system_managed';
  isAssigned?: boolean;
  isPersonal?: boolean;
  appTileId?: string;
  requiresPin?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalApps: number;
  loginAttempts: number;
}