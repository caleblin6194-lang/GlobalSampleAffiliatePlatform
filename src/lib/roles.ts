export type Role = 'admin' | 'merchant' | 'creator' | 'vendor';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  merchant: 'Brand Merchant',
  creator: 'Content Creator',
  vendor: 'Supplier Vendor',
};

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'text-red-500',
  merchant: 'text-blue-500',
  creator: 'text-purple-500',
  vendor: 'text-green-500',
};

export const roleGuard = (userRole: Role, requiredRole: Role): boolean => {
  return userRole === requiredRole;
};
