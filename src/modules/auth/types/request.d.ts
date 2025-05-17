import { Request } from 'express';

// Interface for the user object your auth system attaches
export interface AuthUser {
  id: number; // or number
  // Add other properties your JWT/user object contains:
  // email?: string;
  // roles?: string[];
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
