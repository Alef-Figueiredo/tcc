const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

// ====================== CONFIGURAÇÕES DE SEGURANÇA ======================
const JWT_SECRET = process.env.JWT_SECRET || 'parladata-jwt-secret-muito-forte-alterar-em-producao-2026';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const EMAIL_USER = process.env.EMAIL_USER || 'aleffigueiredo4@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'xefy nclj skrt hskr';

app.use(cors({ 
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ====================== JWT MIDDLEWARE ======================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
};

// ====================== CRIAÇÃO AUTOMÁTICA DO BANCO ======================
async function createDatabaseIfNotExists() {
  try {
    const tempPool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
    });

    await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'parladb'} 
                          CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);

    console.log(`✅ Banco de dados '${process.env.DB_NAME || 'parladb'}' criado ou já existia.`);

    await tempPool.end();
  } catch (err) {
    console.error('❌ Erro ao criar banco de dados:', err.message);
    process.exit(1);
  }
}

// ====================== CONEXÃO PRINCIPAL COM O BANCO ======================
let pool;

async function initDB() {
  await createDatabaseIfNotExists();

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'parladb',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      reset_token VARCHAR(255),
      reset_expires BIGINT
    )
  `);

  console.log('✅ Tabela "users" verificada/criada com sucesso!');
}

initDB().catch(err => {
  console.error('Erro fatal na inicialização do banco:', err);
  process.exit(1);
});

// ====================== ESQUECI A SENHA ======================
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

  try {
    const [rows] = await pool.query('SELECT id, nome FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) return res.status(404).json({ message: 'E-mail não encontrado' });

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000;

    await pool.query('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?', 
      [resetToken, expires, user.id]);

    const resetLink = `${FRONTEND_URL}/?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: '🔑 Redefina sua senha - ParlaData',
      html: `
        <h2>Olá, ${user.nome}!</h2>
        <p>Você pediu para redefinir sua senha.</p>
        <p><a href="${resetLink}" style="background:#1877f2;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;">CLIQUE AQUI PARA REDEFINIR A SENHA</a></p>
        <p>O link é válido por 1 hora.</p>
        <p>Se não foi você, ignore este e-mail.</p>
      `
    });

    res.json({ message: 'Link de redefinição enviado para o seu e-mail!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// ====================== REDEFINIR SENHA ======================
app.post('/reset-password', async (req, res) => {
  const { token, novaSenha } = req.body;
  if (!token || !novaSenha) return res.status(400).json({ message: 'Token e senha são obrigatórios' });
  if (novaSenha.length < 6) return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE reset_token = ? AND reset_expires > ?', 
      [token, Date.now()]);

    if (rows.length === 0) return res.status(400).json({ message: 'Link inválido ou expirado' });

    const hashed = await bcrypt.hash(novaSenha, 10);
    await pool.query('UPDATE users SET senha = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', 
      [hashed, rows[0].id]);

    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar senha' });
  }
});

// ====================== CHECK EMAIL ======================
app.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email obrigatório' });

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// ====================== CADASTRO ======================
app.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: 'Campos obrigatórios' });

  try {
    const hashed = await bcrypt.hash(senha, 10);
    await pool.query('INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)', 
      [nome, email.toLowerCase(), hashed]);
    res.json({ message: 'Usuário criado com sucesso' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email já cadastrado' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
});

// ====================== LOGIN ======================
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ message: 'Email e senha obrigatórios' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) return res.status(401).json({ message: 'Credenciais inválidas' });

    const user = rows[0];
    if (!(await bcrypt.compare(senha, user.senha))) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nome: user.nome },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado',
      nome: user.nome,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// ====================== ATUALIZAR DADOS ======================
app.put('/update', async (req, res) => {
  const { email, novoNome, novoEmail, novaSenha } = req.body;
  if (!email) return res.status(400).json({ message: 'Email atual obrigatório' });

  try {
    let updates = [];
    let params = [];

    if (novoNome?.trim()) { updates.push('nome = ?'); params.push(novoNome.trim()); }
    if (novoEmail?.trim()) { updates.push('email = ?'); params.push(novoEmail.trim().toLowerCase()); }
    if (novaSenha?.trim()) {
      const hashed = await bcrypt.hash(novaSenha.trim(), 10);
      updates.push('senha = ?'); params.push(hashed);
    }

    if (updates.length === 0) return res.status(400).json({ message: 'Nenhum dado para atualizar' });

    params.push(email.trim().toLowerCase());
    const query = `UPDATE users SET ${updates.join(', ')} WHERE email = ?`;

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

    res.json({ message: 'Dados atualizados com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar dados' });
  }
});

// ====================== EXCLUIR CONTA ======================
app.delete('/delete', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ message: 'Email e senha obrigatórios' });

  try {
    const [rows] = await pool.query('SELECT senha FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

    if (!(await bcrypt.compare(senha, rows[0].senha))) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    await pool.query('DELETE FROM users WHERE email = ?', [email.toLowerCase()]);
    res.json({ message: 'Conta excluída com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao excluir conta' });
  }
});

// ====================== PAUTAS REAIS DA CÂMARA  ======================
app.get('/api/pautas', async (req, res) => {   
  try {
    console.log('🔄 Buscando pautas que já tiveram votação...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // Busca direta pelas votações mais recentes (sem filtro de data rígido)
    const response = await fetch(
      'https://dadosabertos.camara.leg.br/api/v2/votacoes?itens=12&ordem=DESC&ordenarPor=data',
      { 
        signal: controller.signal,
        headers: { 'User-Agent': 'ParlaData-TCC/1.0' }
      }
    );

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = await response.json();

    const pautasFormatadas = [];

    for (const votacao of data.dados) {
      if (!votacao.proposicao) continue;

      const prop = votacao.proposicao;

      let titulo = `${prop.siglaTipo || 'PROJETO'} ${prop.numero || '0'}/${prop.ano || '2026'}`;
      if (prop.descricaoTipo) titulo += ` - ${prop.descricaoTipo}`;

      pautasFormatadas.push({
        id: prop.id,
        status: votacao.aprovacao || 'Em Andamento',
        cor: 'andamento',
        titulo: titulo,
        descricao: prop.ementa ? prop.ementa.substring(0, 170) + '...' : 'Sem ementa disponível',
        data: votacao.data 
          ? votacao.data.split('T')[0].split('-').reverse().join('/') 
          : 'Data não informada',
        area: prop.tema || prop.siglaTipo || 'Diversos'
      });

      if (pautasFormatadas.length >= 12) break;
    }

    // Se não encontrou nenhuma com votação, volta para o método antigo (fallback)
    if (pautasFormatadas.length === 0) {
      console.log('⚠️ Nenhuma votação recente encontrada. Usando fallback...');
      const fallbackRes = await fetch(
        'https://dadosabertos.camara.leg.br/api/v2/proposicoes?itens=12&ordem=DESC&ordenarPor=id',
        { signal: controller.signal }
      );
      const fallbackData = await fallbackRes.json();
      
      fallbackData.dados.forEach(p => {
        let titulo = `${p.siglaTipo || 'PROJETO'} ${p.numero || '0'}/${p.ano || '2026'}`;
        if (p.descricaoTipo) titulo += ` - ${p.descricaoTipo}`;
        
        pautasFormatadas.push({
          id: p.id,
          status: 'Em Andamento',
          cor: 'andamento',
          titulo: titulo,
          descricao: p.ementa ? p.ementa.substring(0, 170) + '...' : 'Sem ementa disponível',
          data: p.dataApresentacao ? p.dataApresentacao.split('T')[0].split('-').reverse().join('/') : 'Data não informada',
          area: p.tema || p.siglaTipo || 'Diversos'
        });
      });
    }

    console.log(`✅ Sucesso! ${pautasFormatadas.length} pautas carregadas`);
    res.json(pautasFormatadas);

  } catch (err) {
    console.error('❌ Erro ao buscar pautas:', err.message);
    res.status(500).json([]);
  }
});

app.listen(3000, () => {
  console.log('✅ Backend MySQL rodando em http://localhost:3000');
  console.log(`   FRONTEND_URL configurado: ${FRONTEND_URL}`);
});