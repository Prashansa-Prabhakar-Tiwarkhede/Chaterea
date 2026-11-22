import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setTokens, clearTokens, setOnTokensRefreshed } from "../lib/api.js";
import {
  generateEncryptionKeyPair,
  generateSigningKeyPair,
  exportPublicKeyPem,
  exportPrivateKeyPem,
} from "../lib/crypto.js";
import { saveKeyPem, loadKeyPem, KEYS } from "../lib/keyStore.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken"));
  const [refreshTokenValue, setRefreshTokenValue] = useState(() => localStorage.getItem("refreshToken"));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const persistTokens = useCallback((tokens) => {
    setTokens(tokens);
    setAccessToken(tokens.accessToken);
    setRefreshTokenValue(tokens.refreshToken);
  }, []);

  setOnTokensRefreshed(persistTokens);

  // Hydrate user profile on startup if token is available
  useEffect(() => {
    if (accessToken) {
      api.me()
        .then((profile) => {
          const userData = {
            id: profile.id,
            email: profile.email,
            displayName: profile.displayName,
            role: profile.role,
          };
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        })
        .catch(() => {
          // Token might be expired; refreshAccessToken will handle in apiRequest
        });
    }
  }, [accessToken]);

  const register = useCallback(async ({ email, password, displayName }) => {
    const encryptionKeys = await generateEncryptionKeyPair();
    const signingKeys = await generateSigningKeyPair();

    const encryptionPublicKey = await exportPublicKeyPem(encryptionKeys.publicKey);
    const signingPublicKey = await exportPublicKeyPem(signingKeys.publicKey);

    await api.register({ email, password, displayName, encryptionPublicKey, signingPublicKey });

    const encPrivPem = await exportPrivateKeyPem(encryptionKeys.privateKey);
    const sigPrivPem = await exportPrivateKeyPem(signingKeys.privateKey);

    // Save with email as scope so keys are never lost across users
    await saveKeyPem(KEYS.ENCRYPTION_PRIVATE, encPrivPem, email);
    await saveKeyPem(KEYS.SIGNING_PRIVATE, sigPrivPem, email);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const tokens = await api.login({ email, password });
    persistTokens(tokens);

    const userData = { id: tokens.userId, email: tokens.email, displayName: tokens.displayName, role: tokens.role };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    // Check private key availability
    const hasKeys = await loadKeyPem(KEYS.ENCRYPTION_PRIVATE, tokens.userId);
    if (!hasKeys) {
      console.warn("No local private key found for this account on this device.");
    }
    return tokens;
  }, [persistTokens]);

  const logout = useCallback(async () => {
    if (refreshTokenValue) {
      await api.logout(refreshTokenValue).catch(() => {});
    }
    clearTokens();
    localStorage.removeItem("user");
    setAccessToken(null);
    setRefreshTokenValue(null);
    setUser(null);
  }, [refreshTokenValue]);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, user, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
