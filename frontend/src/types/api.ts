/**API types and interfaces */

export interface HealthResponse {
  status: "ok" | "error";
  service: string;
  timestamp: string;
}

export interface MetricCard {
  label: string;
  value: string;
  hint: string;
}

export interface UserSerializer {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "manager" | "user";
  bio?: string;
  profile_picture?: string;
  is_staff: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginSerializer {
  email: string;
  password: string;
}

export interface TokenResponseSerializer {
  access: string;
  refresh: string;
  user: UserSerializer;
}

export interface RegisterSerializer {
  email: string;
  username: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}
