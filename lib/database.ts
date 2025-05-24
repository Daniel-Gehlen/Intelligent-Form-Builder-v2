import Database from "better-sqlite3"
import path from "path"

let db: Database.Database | null = null

export async function initDatabase() {
  if (db) return db

  const dbPath =
    process.env.NODE_ENV === "production" ? "/tmp/form-builder.db" : path.join(process.cwd(), "form-builder.db")

  console.log(`[DATABASE] Inicializando banco em: ${dbPath}`)

  db = new Database(dbPath)

  db.pragma("foreign_keys = ON")
  db.pragma("journal_mode = WAL")
  db.pragma("synchronous = NORMAL")

  await createTables()

  console.log("[DATABASE] Banco inicializado com sucesso")
  return db
}

async function createTables() {
  if (!db) throw new Error("Banco não inicializado")

  console.log("[DATABASE] Criando tabelas...")

  db.exec(`
    CREATE TABLE IF NOT EXISTS forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      fields TEXT NOT NULL,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      integration_results TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
    CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `)

  // Criar usuário admin padrão se não existir
  const existingUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }

  if (existingUsers.count === 0) {
    console.log("[DATABASE] Criando usuário admin padrão...")

    const bcrypt = require("bcryptjs")
    const defaultPassword = "admin123"
    const passwordHash = await bcrypt.hash(defaultPassword, 12)

    db.prepare(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `).run("admin@formbuilder.com", passwordHash, "Administrador", "admin")

    console.log("[DATABASE] Usuário admin criado - Email: admin@formbuilder.com, Senha: admin123")
  }

  console.log("[DATABASE] Todas as tabelas criadas com sucesso")
}

export function closeDatabase() {
  if (db) {
    console.log("[DATABASE] Fechando conexão com o banco")
    db.close()
    db = null
  }
}
