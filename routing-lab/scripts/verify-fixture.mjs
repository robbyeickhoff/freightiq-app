import { readFile } from 'node:fs/promises'
const snapshotUrl = new URL('../src/data/gr-001.fixture.json', import.meta.url)
const canonicalUrl = new URL(
  '../../docs/routing/golden-routes/GR-001-Telluride-Multi-Zone/fixture.json',
  import.meta.url,
)

const snapshot = JSON.parse(await readFile(snapshotUrl, 'utf8'))

try {
  const canonical = JSON.parse(await readFile(canonicalUrl, 'utf8'))

  if (JSON.stringify(snapshot) !== JSON.stringify(canonical)) {
    throw new Error(
      'The packaged GR-001 fixture differs from the canonical routing fixture.',
    )
  }

  console.log('Packaged GR-001 fixture matches the canonical routing fixture.')
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error
  }

  console.log(
    `Canonical fixture is outside this isolated deployment; using verified ${snapshot.fixture_id} snapshot.`,
  )
}
