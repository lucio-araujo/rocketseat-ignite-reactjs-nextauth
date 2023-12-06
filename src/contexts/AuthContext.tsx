import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Router from "next/router";
import { api } from "../services/apiClient";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { User } from "../models/user";

type SignInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: (isFromChannel?: boolean) => void;
  user: User | undefined;
  isAuthenticated: boolean;
};

type AuthContextProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext({} as AuthContextData);

export function signOut(isFromChannel = false) {
  destroyCookie(undefined, "nextAuth.token");
  destroyCookie(undefined, "nextAuth.refreshToken");

  if (!isFromChannel) {
    authChannel.postMessage("signOut");
  }

  Router.push("/");
}

let authChannel: BroadcastChannel;

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel("auth");
    authChannel.onmessage = (message) => {
      switch (message.data) {
        case "signOut":
          signOut(true);
          break;
        case "signIn":
          Router.push("/dashboard");
          break;
        default:
          break;
      }
    };

    return () => {
      authChannel.close();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { "nextAuth.token": token } = parseCookies();

      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          const {
            data: { email, roles, permissions },
          } = await api.get("/me");

          setUser({ email, roles, permissions });
        } catch (_) {
          signOut();
        }
      }
    })();
  }, []);

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const { data } = await api.post("/sessions", { email, password });
      const { roles, permissions, token, refreshToken } = data;

      setCookie(undefined, "nextAuth.token", token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      setCookie(undefined, "nextAuth.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser({ email, roles, permissions });

      authChannel.postMessage("signIn");

      Router.push("/dashboard");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, user, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const authContext = useContext(AuthContext);
  return authContext;
}
