export interface WooHeadlessConfig {
  url: string;
  consumerKey?: string;
  consumerSecret?: string;
  debug?: boolean;
}

export interface NextFetchRequestInit extends RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

// Placeholder types for better strictness than 'any'
export interface AuthResponse {
  token: string;
  [key: string]: any;
}

export interface GenericResponse {
  [key: string]: any;
}
