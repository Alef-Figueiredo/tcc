const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// ====================== CRIAÇÃO AUTOMÁTICA DO BANCO ======================
async function createDatabaseIfNotExists() {
  try {
    // Conecta no MySQL sem escolher banco ainda
    const tempPool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
    });

    await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'parladb'} 
                          CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);

    console.log(`✅ Banco de dados '${process.env.DB_NAME || 'parladb'}' criado ou já existia.`);

    await tempPool.end(); // fecha conexão temporária
  } catch (err) {
    console.error('❌ Erro ao criar banco de dados:', err.message);
    process.exit(1); // para o servidor se der erro grave
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

  // Cria tabela users
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

console.log('Iniciando servidor...');
// ====================== ESQUECI A SENHA ======================
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

  try {
    const [rows] = await pool.query('SELECT id, nome FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) return res.status(404).json({ message: 'E-mail não encontrado' });

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hora

    await pool.query('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?', 
      [resetToken, expires, user.id]);

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'aleffigueiredo4@gmail.com',
        pass: 'xefy nclj skrt hskr'
      }
    });

    await transporter.sendMail({
      from: 'aleffigueiredo4@gmail.com',
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

    res.json({
      message: 'Login realizado',
      nome: user.nome,
      token: 'fake-token-' + user.email
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

    if (novoNome?.trim()) {
      updates.push('nome = ?');
      params.push(novoNome.trim());
    }
    if (novoEmail?.trim()) {
      updates.push('email = ?');
      params.push(novoEmail.trim().toLowerCase());
    }
    if (novaSenha?.trim()) {
      const hashed = await bcrypt.hash(novaSenha.trim(), 10);
      updates.push('senha = ?');
      params.push(hashed);
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

// ====================== PAUTAS REAIS DA CÂMARA ======================
app.get('/api/pautas', async (req, res) => {
  try {
    console.log('🔄 Buscando pautas reais da Câmara...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(
      'https://dadosabertos.camara.leg.br/api/v2/proposicoes?itens=12&ordem=DESC&ordenarPor=id',
      { 
        signal: controller.signal,
        headers: { 'User-Agent': 'ParlaData-TCC/1.0' }
      }
    );

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const data = await response.json();

    const pautasFormatadas = data.dados.map((p) => {
      // Título mais seguro e limpo
      let titulo = `${p.siglaTipo || 'PROJETO'} ${p.numero || '0'}/${p.ano || '2026'}`;
      
      if (p.descricaoTipo && p.descricaoTipo.trim() !== '') {
        titulo += ` - ${p.descricaoTipo}`;
      } else if (p.ementa) {
        titulo += ` - ${p.ementa.substring(0, 70)}...`;
      } else {
        titulo += ` - Sem título disponível`;
      }

      return {
        id: p.id,
        status: 'Em Andamento',
        cor: 'andamento',
        titulo: titulo,
        descricao: p.ementa ? p.ementa.substring(0, 170) + '...' : 'Sem ementa disponível',
        data: p.dataApresentacao 
          ? p.dataApresentacao.split('T')[0].split('-').reverse().join('/') 
          : 'Data não informada',
        area: p.tema || p.siglaTipo || 'Diversos'
      };
    });

    console.log(`✅ Sucesso! ${pautasFormatadas.length} pautas carregadas`);
    res.json(pautasFormatadas);

  } catch (err) {
    console.error('❌ Erro ao buscar pautas:', err.message);
    
    // Fallback seguro
    res.json([
      { id: 1, status: 'Aprovada', cor: 'aprovada', titulo: 'PL 2547/2024 - Reforma Tributária', descricao: 'Proposta de alteração no sistema tributário...', data: '14/03/2024', area: 'Economia' },
      { id: 2, status: 'Em Andamento', cor: 'andamento', titulo: 'PEC 45/2023 - Educação Digital', descricao: 'Inclusão de educação digital como direito fundamental...', data: '09/03/2024', area: 'Educação' },
      { id: 3, status: 'Rejeitada', cor: 'rejeitada', titulo: 'PL 1823/2024 - Meio Ambiente', descricao: 'Regulamentação de práticas sustentáveis...', data: '07/03/2024', area: 'Meio Ambiente' }
    ]);
  }
});

app.listen(3000, () => {
  console.log('✅ Backend MySQL rodando em http://localhost:3000');
});