import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "seu_segredo_jwt_aqui";

export const handleSignUp = async (req, res) => {
  try {
    const { email, password, nome, perfil, ano } = req.body;

    if (!email || !password || !nome || !perfil) {
      return res.status(400).json({
        error: "Email, senha, nome e perfil são obrigatórios",
      });
    }

    // Validar perfil
    if (!["ALUNO", "PROFESSOR"].includes(perfil)) {
      return res.status(400).json({
        error: "Perfil deve ser ALUNO ou PROFESSOR",
      });
    }

    // Validar ano se for aluno
    if (perfil === "ALUNO" && !ano) {
      return res.status(400).json({
        error: "Ano é obrigatório para alunos",
      });
    }

    if (perfil === "ALUNO" && !["1º ano", "2º ano", "3º ano"].includes(ano)) {
      return res.status(400).json({
        error: "Ano deve ser 1º ano, 2º ano ou 3º ano",
      });
    }

    // Ano não deve ser enviado para professores
    if (perfil === "PROFESSOR" && ano) {
      return res.status(400).json({
        error: "Ano não deve ser informado para professores",
      });
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Usuário já existe" });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nome,
        perfil,
        ano: perfil === "ALUNO" ? ano : null,
      },
    });

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        perfil: user.perfil,
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        perfil: user.perfil,
        ano: user.ano,
      },
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const handleSignIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        perfil: user.perfil,
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        perfil: user.perfil,
        ano: user.ano,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};
