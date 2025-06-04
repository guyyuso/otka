export interface AppData {
  id: string;
  name: string;
  logo: string;
  url: string;
  username: string;
  password?: string;
  lastUsed?: string;
  category?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
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