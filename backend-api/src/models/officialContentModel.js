import { getDb } from './db.js'
import { stringifyJsonOrEmptyObject } from '../utils/json.js'


async function upsertOfficialContentImport({ provider, externalId, contentType, title = '', sourceUrl = '', payloadJson = {} }) {
  const [rows] = await getDb().query(
    `INSERT INTO official_content_imports (provider, external_id, content_type, title, source_url, payload_json)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (provider, external_id, content_type) DO UPDATE SET
       title = EXCLUDED.title,
       source_url = EXCLUDED.source_url,
       payload_json = EXCLUDED.payload_json,
       imported_at = NOW()
     RETURNING *`,
    [provider, externalId, contentType, title, sourceUrl, stringifyJsonOrEmptyObject(payloadJson)]
  )
  return rows[0] || null
}

async function upsertSpotProviderRef({ spotId, provider, externalId, sourceUrl = '', payloadJson = {} }) {
  const [rows] = await getDb().query(
    `INSERT INTO spot_provider_refs (spot_id, provider, external_id, source_url, payload_json)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (provider, external_id) DO UPDATE SET
       spot_id = EXCLUDED.spot_id,
       source_url = EXCLUDED.source_url,
       payload_json = EXCLUDED.payload_json
     RETURNING *`,
    [spotId, provider, externalId, sourceUrl, stringifyJsonOrEmptyObject(payloadJson)]
  )
  return rows[0] || null
}

export async function importOfficialContentBatch({ imports = [], spotProviderRefs = [] }) {
  const importedContents = []
  const providerRefs = []

  for (const item of imports) {
    importedContents.push(await upsertOfficialContentImport(item))
  }

  for (const ref of spotProviderRefs) {
    providerRefs.push(await upsertSpotProviderRef(ref))
  }

  return { importedContents, providerRefs }
}
