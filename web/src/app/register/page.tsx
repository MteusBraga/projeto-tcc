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
    perfil: "" as "ALUNO" | "PROFESSOR" | "",
    ano: "",
  });

  const { register, loading, error } = useAuth();
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
      // Limpar ano quando mudar de perfil
      ...(name === "perfil" && { ano: "" }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }

    if (!formData.perfil) {
      alert("Selecione um perfil");
      return;
    }

    if (formData.perfil === "ALUNO" && !formData.ano) {
      alert("Selecione o ano para alunos");
      return;
    }

    const success = await register(
      formData.email,
      formData.password,
      formData.nome,
      formData.perfil as "ALUNO" | "PROFESSOR",
      formData.ano
    );

    if (success) {
      router.push("/questoes");
    }
  };

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center mb-6">Criar Conta</h1>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col">
              <label className="label">
                <span className="label-text">Nome Completo</span>
              </label>
              <input
                type="text"
                name="nome"
                placeholder="Seu nome completo"
                className="input input-bordered w-full mb-4"
                value={formData.nome}
                onChange={handleChange}
                required
              />

              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="seu@email.com"
                className="input input-bordered w-full mb-4"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label className="label">
                <span className="label-text">Perfil</span>
              </label>
              <select
                name="perfil"
                className="select select-bordered w-full mb-4"
                value={formData.perfil}
                onChange={handleChange}
                required
              >
                <option value="">Selecione seu perfil</option>
                <option value="ALUNO">Aluno</option>
                <option value="PROFESSOR">Professor</option>
              </select>
              {formData.perfil === "ALUNO" && (
                <>
                  <label className="label">
                    <span className="label-text">Ano</span>
                  </label>
                  <select
                    name="ano"
                    className="select select-bordered w-full mb-4"
                    value={formData.ano}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione o ano</option>
                    <option value="1º ano">1º ano</option>
                    <option value="2º ano">2º ano</option>
                    <option value="3º ano">3º ano</option>
                  </select>
                </>
              )}
              <label className="label">
                <span className="label-text">Senha</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Sua senha"
                className="input input-bordered w-full mb-4"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <label className="label">
                <span className="label-text">Confirmar Senha</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirme sua senha"
                className="input input-bordered w-full"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
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
