// hooks/useAuth.ts
"use client";

import { urldev, urlprod } from "@/utils/url";
import { useState, useEffect, useCallback } from "react";

interface User {
  id: number;
  email: string;
  nome: string;
  perfil: "ALUNO" | "PROFESSOR";
  ano?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Inicia como true para verificação inicial
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${urlprod}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro no login");
      }

      const data: AuthResponse = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    nome: string,
    perfil: "ALUNO" | "PROFESSOR",
    ano?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const requestBody: any = { email, password, nome, perfil };
      if (perfil === "ALUNO") {
        requestBody.ano = ano;
      }

      const res = await fetch(`${urlprod}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro no registro");
      }

      const data: AuthResponse = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setError(null);
  }, []);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setLoading(false);
        return true;
      } catch {
        logout();
        setLoading(false);
        return false;
      }
    }
    setLoading(false);
    return false;
  }, [logout]);

  const isProfessor = () => {
    return user?.perfil === "PROFESSOR";
  };

  const isAluno = () => {
    return user?.perfil === "ALUNO";
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const getToken = () => {
    return localStorage.getItem("token");
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    isProfessor,
    isAluno,
    isAuthenticated,
    getToken,
  };
}
