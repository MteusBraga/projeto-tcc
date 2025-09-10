// app/register/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { register, loading, error } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }

    const success = await register(
      formData.email,
      formData.password,
      formData.nome
    );
    if (success) {
      router.push("/questoes");
    }
  };

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center mb-6">Criar Conta</h1>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nome Completo</span>
              </label>
              <input
                type="text"
                name="nome"
                placeholder="Seu nome completo"
                className="input input-bordered"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="seu@email.com"
                className="input input-bordered"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Senha</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Sua senha"
                className="input input-bordered"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Confirmar Senha</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirme sua senha"
                className="input input-bordered"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm">
              Já tem uma conta?{" "}
              <Link href="/login" className="link link-primary">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
