/**
 * Camada de dados com a MESMA interface do driver oficial do MongoDB.
 *
 * PROTÓTIPO (padrão): salva tudo em data/db.json — zero configuração.
 * PRODUÇÃO: defina a variável de ambiente MONGODB_URI e rode
 *   npm install mongodb
 *   MONGODB_URI="mongodb+srv://usuario:senha@cluster/casa" npm start
 *
 * Como o código do servidor só usa métodos que existem nos dois
 * (find / findOne / insertOne / updateOne / deleteOne / countDocuments),
 * a migração é trocar a variável de ambiente. Nada mais muda.
 *
 * Observação: os _id são strings (crypto.randomUUID). Isso funciona
 * nativamente no MongoDB e evita conversões de ObjectId na migração.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');

/* ---------------------------------------------------------------- */
/* Adaptador JSON (protótipo)                                        */
/* ---------------------------------------------------------------- */

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

let _data = loadData();
let _saveTimer = null;

function gravaAgora() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(_data, null, 2));
}

function persist() {
  // debounce para não escrever no disco a cada operação
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(gravaAgora, 60);
}

/* grava imediatamente o que estiver pendente — usado por scripts que
   terminam logo depois de escrever (ex.: importação da planilha) */
function flush() {
  clearTimeout(_saveTimer);
  if (!process.env.MONGODB_URI) gravaAgora();
}

// suporte a igualdade, $in, $ne, $gte, $lte — o suficiente para o sistema
function matches(doc, query = {}) {
  return Object.entries(query).every(([k, cond]) => {
    const val = doc[k];
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      if ('$in' in cond) return cond.$in.includes(val);
      if ('$ne' in cond) return val !== cond.$ne;
      if ('$gte' in cond && !(val >= cond.$gte)) return false;
      if ('$lte' in cond && !(val <= cond.$lte)) return false;
      return true;
    }
    return val === cond;
  });
}

function applyUpdate(doc, update) {
  if (update.$set) Object.assign(doc, update.$set);
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      if (!Array.isArray(doc[k])) doc[k] = [];
      doc[k].push(v);
    }
  }
  if (update.$pull) {
    for (const [k, v] of Object.entries(update.$pull)) {
      if (Array.isArray(doc[k])) doc[k] = doc[k].filter((x) => x !== v);
    }
  }
  return doc;
}

class JsonCollection {
  constructor(name) {
    this.name = name;
    if (!_data[name]) _data[name] = [];
  }
  get docs() {
    return _data[this.name];
  }
  find(query = {}) {
    let results = this.docs.filter((d) => matches(d, query));
    const cursor = {
      sort(spec) {
        const [[key, dir]] = Object.entries(spec);
        results = [...results].sort((a, b) =>
          (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * dir
        );
        return cursor;
      },
      limit(n) {
        results = results.slice(0, n);
        return cursor;
      },
      async toArray() {
        return results.map((d) => ({ ...d }));
      },
    };
    return cursor;
  }
  async findOne(query = {}) {
    const d = this.docs.find((doc) => matches(doc, query));
    return d ? { ...d } : null;
  }
  async insertOne(doc) {
    const toInsert = { _id: doc._id || crypto.randomUUID(), ...doc };
    this.docs.push(toInsert);
    persist();
    return { insertedId: toInsert._id };
  }
  async updateOne(query, update) {
    const d = this.docs.find((doc) => matches(doc, query));
    if (d) {
      applyUpdate(d, update);
      persist();
      return { matchedCount: 1, modifiedCount: 1 };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }
  async deleteOne(query) {
    const i = this.docs.findIndex((doc) => matches(doc, query));
    if (i >= 0) {
      this.docs.splice(i, 1);
      persist();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
  async deleteMany(query) {
    const before = this.docs.length;
    _data[this.name] = this.docs.filter((d) => !matches(d, query));
    persist();
    return { deletedCount: before - _data[this.name].length };
  }
  async countDocuments(query = {}) {
    return this.docs.filter((d) => matches(d, query)).length;
  }
}

/* ---------------------------------------------------------------- */
/* Seleção do adaptador                                              */
/* ---------------------------------------------------------------- */

let getCollection;
let ready;

if (process.env.MONGODB_URI) {
  // ---- MongoDB real ----
  const { MongoClient, ObjectId } = require('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI);
  let mongoDb;
  ready = client.connect().then(() => {
    mongoDb = client.db(process.env.MONGODB_DB || 'casa_umbanda');
    console.log('[db] Conectado ao MongoDB');
  });

  /* O sistema inteiro trata _id como texto (o mesmo formato do banco local).
     O MongoDB, por padrão, criaria ObjectId — e aí links como
     /admin/membros/<id> não encontrariam ninguém. Então:
       1) todo documento novo nasce com _id em texto (UUID);
       2) buscas por _id aceitam também ObjectId, para não quebrar dados
          que já tenham sido gravados no formato antigo. */
  const comId = (doc) => ({ _id: doc._id || crypto.randomUUID(), ...doc });

  const traduz = (query) => {
    if (!query || typeof query !== 'object') return query;
    const id = query._id;
    if (typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id)) {
      return { ...query, _id: { $in: [id, new ObjectId(id)] } };
    }
    return query;
  };

  /* Converte qualquer ObjectId para texto na SAÍDA. Sem isto, comparações
     do tipo `pagamento.membroId === membro._id` falham quando os dados foram
     gravados antes da padronização — o que fazia nomes virarem "?" e
     mensalidades duplicarem a cada visita à tela. */
  const paraTexto = (v) => {
    if (v == null) return v;
    if (v instanceof ObjectId) return v.toString();
    if (Array.isArray(v)) return v.map(paraTexto);
    if (v instanceof Date) return v;
    if (typeof v === 'object') {
      const saida = {};
      for (const [k, x] of Object.entries(v)) saida[k] = paraTexto(x);
      return saida;
    }
    return v;
  };

  const cursorTexto = (cursor) => ({
    sort: (...a) => cursorTexto(cursor.sort(...a)),
    limit: (...a) => cursorTexto(cursor.limit(...a)),
    toArray: async () => (await cursor.toArray()).map(paraTexto),
  });

  getCollection = (name) => {
    const c = mongoDb.collection(name);
    return {
      find: (q = {}, ...r) => cursorTexto(c.find(traduz(q), ...r)),
      findOne: async (q = {}, ...r) => paraTexto(await c.findOne(traduz(q), ...r)),
      countDocuments: (q = {}, ...r) => c.countDocuments(traduz(q), ...r),
      insertOne: (doc, ...r) => c.insertOne(comId(doc), ...r),
      insertMany: (docs, ...r) => c.insertMany(docs.map(comId), ...r),
      updateOne: (q, u, ...r) => c.updateOne(traduz(q), u, ...r),
      updateMany: (q, u, ...r) => c.updateMany(traduz(q), u, ...r),
      deleteOne: (q, ...r) => c.deleteOne(traduz(q), ...r),
      deleteMany: (q, ...r) => c.deleteMany(traduz(q), ...r),
    };
  };
} else {
  // ---- JSON local (protótipo) ----
  ready = Promise.resolve();
  const cache = {};
  getCollection = (name) => (cache[name] ??= new JsonCollection(name));
  console.log('[db] Usando banco local em data/db.json (protótipo). Para MongoDB, defina MONGODB_URI.');
}

module.exports = { col: (name) => getCollection(name), ready, flush };
