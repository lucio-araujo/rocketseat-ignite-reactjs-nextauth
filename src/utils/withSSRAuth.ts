import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';
import { destroyCookie, parseCookies } from 'nookies';
import jwt_decode from 'jwt-decode';
import { AuthTokenError } from '../errors/AuthTokenError';
import { User } from '../models/user';
import { validateUserPermissions } from './validateUserPermissions';

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
};

export function withSSRAuth<P>(
  fn: GetServerSideProps<P>,
  options?: WithSSRAuthOptions
) {
  return async (
    ctx: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx);

    if (!cookies['nextAuth.token']) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    if (options) {
      const user = jwt_decode<User>(cookies['nextAuth.token']);

      const { permissions, roles } = options;

      if (!validateUserPermissions({ user, permissions, roles })) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          },
        };
      }
    }

    try {
      return await fn(ctx);
    } catch (err) {
      if (err instanceof AuthTokenError) {
        destroyCookie(ctx, 'nextAuth.token');
        destroyCookie(ctx, 'nextAuth.refreshToken');
        return {
          redirect: {
            destination: '/',
            permanent: false,
          },
        };
      } else {
        throw err;
      }
    }
  };
}
