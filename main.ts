import { Database } from "bun:sqlite"

import { base_embed_url, data_api, themeId } from "./constants"
import { fetchDetail } from "./controller/fetch-detail"
import { loadStreamList } from "./controller/load-stream-list"
import { Hono } from "hono"
import { logger } from "hono/logger"
import { etag } from "hono/etag"
import { extractIdFromSlug } from "./logic/extract-model-id-from-slug"

const ID = "changchun-yatai-vs-shanghai-port-rdxjJFB"

const db = new Database("stream_list.sqlite")

db.run(`
  CREATE TABLE IF NOT EXISTS stream_cache (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);
`)

const app = new Hono()
app.use(logger(), etag())

app.get("/featured" , async c => {
  return c.json(await fetch(`${data_api}/api/match/vb/featured`).then(async res => res.ok ? res.json() as Promise<any> : Promise.reject(await res.text())).then(data => {
    return {
      ...data,
      featured: data.featured.map((item: { slug: string; id: string }) => {
        return {
          ...item,
          slug: `${item.slug}-${item.id}`
        }
      })
    }
  }))
})
app.get("/details/:id", async (c) => {
  const modelId = extractIdFromSlug(c.req.param("id"))
  const match = await fetchDetail(modelId)

  return c.json({...match, timestamp: new Date(match.timestamp)})
})
app.get("/stream_list/:id", async (c) => {
  const modelId = extractIdFromSlug(c.req.param("id"))

  // // $1
  // const modelId = extractIdFromSlug(ID)
  // const match = await fetchDetail(modelId)
  // $2
  //  match.referee.id
  // $3
  //  match.venue.id
  // $4
  //  match.checksum
  const cached = getCachedStreamList(modelId)
  if (cached !== null) {
    return c.json(cached)
  }

  const match = await fetchDetail(modelId)

  const data = await loadStreamList(
    modelId,
    match.referee.id,
    match.venue.id,
    match.checksum
  )

  // Lưu cache
  setCachedStreamList(modelId, data)

  return c.json(data)
})

function getCachedStreamList(id: string): any | null {
  const row = db
    .query("SELECT data, expires_at FROM stream_cache WHERE id = ?")
    .get(id) as { data: string; expires_at: number } | undefined

  if (!row) return null

  const now = Date.now()

  if (row.expires_at < now) {
    // Expired → return []
    return []
  }

  return JSON.parse(row.data)
}

function setCachedStreamList(id: string, data: any, ttlMinutes = 10) {
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000

  db.query(
    `
    INSERT OR REPLACE INTO stream_cache (id, data, expires_at)
    VALUES (?, ?, ?)
  `
  ).run(id, JSON.stringify(data), expiresAt)
}

function getEmbedURL(
  modelId: string,
  url: string,
  id: string,
  t: string,
  stream_link_default: string
) {
  return (
    (base_embed_url || "https://g.zoomplayer.xyz/v15/") +
    "?url=" +
    encodeURIComponent(url) +
    "&n=" +
    id +
    "&id=" +
    modelId +
    "&t=" +
    t +
    "&p=&autoplay=1&theme_id=" +
    themeId +
    (stream_link_default
      ? "&df=" + encodeURIComponent(stream_link_default)
      : "")
  )
}

Bun.serve({ fetch: app.fetch, port: 3000 })
console.log("Server running on http://localhost:3000")
