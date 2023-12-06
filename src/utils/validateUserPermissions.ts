import { User } from '../models/user';

type ValidateUserPermissionsParams = {
  user?: User;
  permissions?: string[];
  roles?: string[];
};

export function validateUserPermissions({
  user,
  permissions,
  roles,
}: ValidateUserPermissionsParams) {
  let [hasPermissions, hasRoles] = [true, true];

  if (!user) {
    return false;
  }

  if (permissions) {
    hasPermissions = permissions.every((permission) =>
      user?.permissions.includes(permission)
    );
  }

  if (roles) {
    hasRoles = roles.some((role) => user?.roles.includes(role));
  }

  return hasPermissions && hasRoles;
}
