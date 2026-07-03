import { Request } from 'express';

// Interface for the user object your auth system attaches
export interface AuthUser {
  id: string;
  realmId?: string;
  roles?: Array<{ name: string }>;
  /** Flattened permission names granted by all of the user's roles. */
  permissions?: string[];
  // Add other properties your JWT/user object contains:
  // email?: string;
}

// Extended Request type for authenticated routes
export interface AuthRequest extends Request {
  user: AuthUser; // Non-optional for routes using AuthGuard
}

// Extend Express's default Request type globally
declare module 'express' {
  export interface Request {
    user?: AuthUser; // Optional for non-authenticated routes
  }
}

//{
//  "compilerOptions": {
//    "typeRoots": [
//      "node_modules/@types",
//      "src/modules/auth/types"  // Add this
//    ]
//  }
//}
