const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "segredo";

// Banco simples (em memória)
let users = [];
let consultas = [];

// Gerar token
function gerarToken(user) {
  return jwt.sign({ id: user.id }, SECRET, { expiresIn: "1h" });
}

// Middleware de autenticação
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ erro: "Sem token" });

  try {
    jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido" });
  }
}

// Cadastro
app.post("/register", async (req, res) => {
  const { nome, email, senha } = req.body;

  const hash = await bcrypt.hash(senha, 10);

  const user = { id: Date.now(), nome, email, senha: hash };
  users.push(user);

  res.json({ mensagem: "Usuário criado" });
});

// Login
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });

  const valid = await bcrypt.compare(senha, user.senha);
  if (!valid) return res.status(401).json({ erro: "Senha inválida" });

  const token = gerarToken(user);
  res.json({ token });
});

// Agendar consulta
app.post("/agendar", auth, (req, res) => {
  const { data, horario } = req.body;

  const consulta = { id: Date.now(), data, horario };
  consultas.push(consulta);

  res.json({ mensagem: "Consulta agendada" });
});

// Listar consultas
app.get("/consultas", auth, (req, res) => {
  res.json(consultas);
});

// Buscar CEP
app.get("/cep/:cep", async (req, res) => {
  const { cep } = req.params;

  const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
  res.json(response.data);
});

// Buscar clima
app.get("/clima/:cidade", async (req, res) => {
  const cidade = req.params.cidade;

  const API_KEY = "SUA_CHAVE_AQUI";

  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${API_KEY}&lang=pt_br`
  );

  res.json(response.data.weather[0]);
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
