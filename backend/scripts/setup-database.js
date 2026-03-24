/**
 * รวม migration ที่ใช้บนเซิร์ฟเวอร์ (เช่น AWS) เป็นคำสั่งเดียว
 *
 * รันจากโฟลเดอร์ backend:
 *   node scripts/setup-database.js
 *
 * ตัวแปรสภาพแวดล้อม (ไม่บังคับ):
 *   SETUP_SKIP_SQL=1       — ข้ามไฟล์ .sql ใน scripts/ (เฉพาะ KBank + users)
 *   SETUP_SKIP_KBANK=1     — ข้าม migrate_kbank.js
 *   SETUP_SKIP_USERS=1     — ไม่รัน createUsers.js
 *   SETUP_DRY_RUN=1        — แสดงขั้นตอนอย่างเดียว ไม่ต่อ DB
 *
 * การเชื่อม DB ใช้ค่าเดียวกับ migrate_kbank.js:
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL
 *   MIGRATE_DB_USER / MIGRATE_DB_PASSWORD (ถ้าต้องการ user ที่มีสิทธิ์ ALTER มากกว่าแอป)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = __dirname;
const BACKEND_ROOT = path.join(__dirname, '..');

dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });

const { Pool } = pg;

/** แยกคำสั่ง SQL โดยเคารพ string / dollar-quote / comment */
function splitSqlStatements(sql) {
  const parts = [];
  let cur = '';
  let i = 0;
  let inSingle = false;
  let inDouble = false;

  const appendChar = (ch) => {
    cur += ch;
  };

  while (i < sql.length) {
    const ch = sql[i];

    if (!inSingle && !inDouble) {
      if (ch === '-' && sql[i + 1] === '-') {
        i += 2;
        while (i < sql.length && sql[i] !== '\n') i++;
        continue;
      }
      if (ch === '/' && sql[i + 1] === '*') {
        i += 2;
        while (i < sql.length - 1 && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
        i += 2;
        continue;
      }
    }

    if (ch === '$' && !inSingle && !inDouble) {
      let j = i + 1;
      while (j < sql.length && sql[j] !== '$') j++;
      if (j >= sql.length) {
        appendChar(ch);
        i++;
        continue;
      }
      const tag = sql.slice(i + 1, j);
      const closeDelim = '$' + tag + '$';
      let k = j + 1;
      while (k < sql.length) {
        if (sql[k] === '$' && sql.slice(k, k + closeDelim.length) === closeDelim) {
          cur += sql.slice(i, k + closeDelim.length);
          i = k + closeDelim.length;
          break;
        }
        k++;
      }
      if (k >= sql.length && i <= k) {
        appendChar(ch);
        i++;
      }
      continue;
    }

    if (ch === "'" && !inDouble) {
      if (inSingle && sql[i + 1] === "'") {
        cur += "''";
        i += 2;
        continue;
      }
      inSingle = !inSingle;
      cur += ch;
      i++;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      cur += ch;
      i++;
      continue;
    }

    if (ch === ';' && !inSingle && !inDouble) {
      const t = cur.trim();
      if (t) parts.push(t);
      cur = '';
      i++;
      continue;
    }

    cur += ch;
    i++;
  }

  const tail = cur.trim();
  if (tail) parts.push(tail);
  return parts;
}

function applyAppUserToGrants(sql) {
  const u = process.env.DB_USER?.trim();
  if (!u) return sql;
  const quoted = '"' + u.replace(/"/g, '""') + '"';
  return sql.replace(/\bhotpot_user\b/g, quoted);
}

const SQL_STEPS = [
  { file: 'createBranchesTable.sql', desc: 'สาขา (branches) + branch_id' },
  { file: 'updateOrdersBranchId.sql', desc: 'อัปเดต orders.branch_id เป็นสาขาหลัก' },
  { file: 'createLineNotificationsTable.sql', desc: 'ตาราง line_notifications' },
  { file: 'fixUniqueConstraints.sql', desc: 'partial unique indexes (branches, users)' },
];

function createPool() {
  return new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.MIGRATE_DB_USER || process.env.DB_USER,
    password: process.env.MIGRATE_DB_PASSWORD || process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

async function runSqlSteps(pool) {
  const client = await pool.connect();
  try {
    for (const step of SQL_STEPS) {
      const full = path.join(SCRIPTS_DIR, step.file);
      if (!fs.existsSync(full)) {
        console.warn(`⚠️  ข้าม (ไม่มีไฟล์): ${step.file}`);
        continue;
      }
      console.log(`\n→ ${step.desc}`);
      console.log(`   ไฟล์: ${step.file}`);
      let sql = fs.readFileSync(full, 'utf8');
      sql = applyAppUserToGrants(sql);
      const statements = splitSqlStatements(sql);
      await client.query('BEGIN');
      try {
        for (const stmt of statements) {
          if (!stmt.trim()) continue;
          await client.query(stmt);
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }
  } finally {
    client.release();
  }
}

function runNodeScript(relativePath, label) {
  const scriptPath = path.join(SCRIPTS_DIR, relativePath);
  if (!fs.existsSync(scriptPath)) {
    console.warn(`⚠️  ข้าม (ไม่มีไฟล์): ${relativePath}`);
    return false;
  }
  console.log(`\n→ ${label}`);
  const r = spawnSync(process.execPath, [scriptPath], {
    cwd: BACKEND_ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error(`${label} ล้มเหลว (exit ${r.status})`);
  }
  return true;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' Hotpot — setup-database (สำหรับรันบนเซิร์ฟเวอร์)');
  console.log('═══════════════════════════════════════════════════════');

  if (process.env.SETUP_DRY_RUN === '1') {
    console.log('\n[SETUP_DRY_RUN=1] ขั้นตอนที่จะรัน:');
    if (process.env.SETUP_SKIP_SQL !== '1') {
      SQL_STEPS.forEach((s) => console.log(`   SQL: ${s.file}`));
    }
    if (process.env.SETUP_SKIP_KBANK !== '1') console.log('   node: migrate_kbank.js');
    if (process.env.SETUP_SKIP_USERS !== '1') console.log('   node: createUsers.js');
    return;
  }

  if (!process.env.DB_HOST || !process.env.DB_NAME) {
    console.error('❌ ตั้งค่า DB_HOST และ DB_NAME (และ DB_USER / DB_PASSWORD) ใน backend/.env');
    process.exit(1);
  }

  const pool = createPool();

  try {
    if (process.env.SETUP_SKIP_SQL !== '1') {
      console.log('\n📂 รัน SQL migrations จาก backend/scripts/ …');
      await runSqlSteps(pool);
      console.log('\n✅ SQL migrations เสร็จ');
    } else {
      console.log('\n⏭️  ข้าม SQL (SETUP_SKIP_SQL=1)');
    }

    await pool.end();

    if (process.env.SETUP_SKIP_KBANK !== '1') {
      runNodeScript('migrate_kbank.js', 'KBank + payment_mode (migrate_kbank.js)');
    } else {
      console.log('\n⏭️  ข้าม KBank (SETUP_SKIP_KBANK=1)');
    }

    if (process.env.SETUP_SKIP_USERS !== '1') {
      runNodeScript('createUsers.js', 'สร้าง user ตัวอย่าง (createUsers.js)');
    } else {
      console.log('\n⏭️  ข้าม createUsers (SETUP_SKIP_USERS=1)');
    }

    console.log('\n🎉 setup-database เสร็จสมบูรณ์');
  } catch (err) {
    console.error('\n❌ setup-database ล้มเหลว:', err.message || err);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

main();
