/** CRC-32 (ISO 3309 / ZIP) lookup table. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

/** CRC-32 of `data` (ZIP polynomial). */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function u16(value: number): Uint8Array {
  const out = new Uint8Array(2);
  out[0] = value & 0xff;
  out[1] = (value >>> 8) & 0xff;
  return out;
}

function u32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = value & 0xff;
  out[1] = (value >>> 8) & 0xff;
  out[2] = (value >>> 16) & 0xff;
  out[3] = (value >>> 24) & 0xff;
  return out;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function toStandaloneBytes(data: Uint8Array): Uint8Array {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy;
}

/**
 * Raw DEFLATE (RFC 1951) via the platform CompressionStream when available.
 * Returns `null` when unsupported or when compression does not shrink the payload.
 */
export async function deflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') {
    return null;
  }
  try {
    const stream = new Blob([toStandaloneBytes(data) as BlobPart])
      .stream()
      .pipeThrough(new CompressionStream('deflate-raw'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return compressed.byteLength > 0 && compressed.byteLength < data.byteLength ? compressed : null;
  } catch {
    return null;
  }
}

interface PreparedEntry {
  readonly path: string;
  readonly uncompressed: Uint8Array;
  readonly payload: Uint8Array;
  readonly method: 0 | 8;
  readonly crc: number;
  readonly localHeaderOffset: number;
}

function buildZipFromPrepared(entries: readonly PreparedEntry[]): Blob {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.path);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0x0800), // UTF-8
      u16(entry.method),
      u16(0),
      u16(0),
      u32(entry.crc),
      u32(entry.payload.byteLength),
      u32(entry.uncompressed.byteLength),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      entry.payload,
    ]);
    locals.push(local);
  }

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.path);
    centrals.push(
      concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(entry.method),
        u16(0),
        u16(0),
        u32(entry.crc),
        u32(entry.payload.byteLength),
        u32(entry.uncompressed.byteLength),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(entry.localHeaderOffset),
        nameBytes,
      ]),
    );
  }

  const centralDirectory = concat(centrals);
  const offset = locals.reduce((sum, part) => sum + part.length, 0);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ]);

  return new Blob([toStandaloneBytes(concat([...locals, centralDirectory, end])) as BlobPart], {
    type: 'application/zip',
  });
}

/**
 * Builds a ZIP using **stored** (uncompressed) entries only — sync, always available.
 */
export function buildStoredZip(files: Readonly<Record<string, string | Uint8Array>>): Blob {
  const paths = Object.keys(files).sort();
  const entries: PreparedEntry[] = [];
  let offset = 0;
  for (const path of paths) {
    const raw = files[path];
    const uncompressed = typeof raw === 'string' ? encodeUtf8(raw) : toStandaloneBytes(raw);
    const payload = uncompressed;
    const entry: PreparedEntry = {
      path,
      uncompressed,
      payload,
      method: 0,
      crc: crc32(uncompressed),
      localHeaderOffset: offset,
    };
    const nameLen = encodeUtf8(path).length;
    offset += 30 + nameLen + payload.byteLength;
    entries.push(entry);
  }
  return buildZipFromPrepared(entries);
}

/**
 * Builds a ZIP, preferring **DEFLATE** (method 8) per entry when CompressionStream is available
 * and compression shrinks the data; otherwise falls back to stored (method 0).
 */
export async function buildZip(files: Readonly<Record<string, string | Uint8Array>>): Promise<Blob> {
  const paths = Object.keys(files).sort();
  const entries: PreparedEntry[] = [];
  let offset = 0;

  for (const path of paths) {
    const raw = files[path];
    const uncompressed = typeof raw === 'string' ? encodeUtf8(raw) : toStandaloneBytes(raw);
    const deflated = await deflateRaw(uncompressed);
    const method: 0 | 8 = deflated ? 8 : 0;
    const payload = deflated ?? uncompressed;
    const entry: PreparedEntry = {
      path,
      uncompressed,
      payload,
      method,
      crc: crc32(uncompressed),
      localHeaderOffset: offset,
    };
    const nameLen = encodeUtf8(path).length;
    offset += 30 + nameLen + payload.byteLength;
    entries.push(entry);
  }

  return buildZipFromPrepared(entries);
}
