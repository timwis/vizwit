import { expose } from 'threads/worker'
import initSqlJs from '@jlongster/sql.js'
import { SQLiteFS } from 'absurd-sql'
import IndexedDBBackend from 'absurd-sql/dist/indexeddb-backend'

let db

;(async function () {
  console.log('worker init')
  db = await setupDatabase()

  if (!doesTableExist('crimes')) {
    console.log('Fetching data')
    const crimes = await fetchData()
    loadData(crimes)
  }
})()

expose({
  query (sql, params) {
    console.log('querying')
    const result = db.exec(sql, params)
    return result
  }
})

async function setupDatabase () {
  const SQL = await initSqlJs({ locateFile: file => file })
  const sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend())
  SQL.register_for_idb(sqlFS)

  SQL.FS.mkdir('/sql')
  SQL.FS.mount(sqlFS, {}, '/sql')
  const path = '/sql/db.sqlite'

  if (typeof SharedArrayBuffer === 'undefined') {
    console.log('SharedArrayBuffer is undefined!')
    const stream = SQL.FS.open(path, 'a+')
    await stream.node.contents.readIfFallback()
    SQL.FS.close(stream)
  }

  const db = new SQL.Database(path, { filename: true })
  // You might want to try `PRAGMA page_size=8192` too!
  db.exec(`
    PRAGMA journal_mode=MEMORY
  `)

  return db
}

function fetchData () {
  const sql = `select dc_key, dispatch_date_time, dc_dist, text_general_code, location_block
    from incidents_part1_part2
    where dispatch_date > '2018-01-01'
    -- limit 100000
  `.trim()
  const url = `https://phl.carto.com/api/v2/sql?q=${encodeURIComponent(sql)}`

  return fetch(url)
    .then((response) => response.json())
    .then((data) => data.rows)
}

function loadData (data) {
  db.exec(`CREATE TABLE IF NOT EXISTS crimes (dc_key, dispatch_date_time datetime,
    dc_dist, text_general_code, location_block)`)

  db.exec('BEGIN TRANSACTION')
  db.exec('DELETE FROM crimes')
  const stmt = db.prepare('INSERT INTO crimes (dc_key, dispatch_date_time, dc_dist, text_general_code, location_block) VALUES (?, ?, ?, ?, ?)')

  for (const row of data) {
    stmt.run([row.dc_key, row.dispatch_date_time, row.dc_dist,
      row.text_general_code, row.location_block])
  }

  db.exec('COMMIT')
  console.log('inserted!')
}

function doesTableExist (table) {
  const stmt = db.prepare(`SELECT name
    FROM sqlite_master
    WHERE type='table' AND name=:table`)
  const result = stmt.getAsObject({ ':table': table })
  stmt.free()
  return !!result.name
}
