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

interface ZipEntry {
  readonly path: string;
  readonly data: Uint8Array;
  readonly crc: number;
  readonly localHeaderOffset: number;
}

/**
 * Builds a ZIP archive using **stored** (uncompressed) entries only.
 * Valid for Office Open XML (`.xlsx`) packages.
 */
export function buildStoredZip(files: Readonly<Record<string, string | Uint8Array>>): Blob {
  const paths = Object.keys(files).sort();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;

  for (const path of paths) {
    const raw = files[path];
    const data = typeof raw === 'string' ? encodeUtf8(raw) : raw;
    const nameBytes = encodeUtf8(path);
    const crc = crc32(data);
    const size = data.length;

    // Local file header (signature PK\x03\x04), method 0 = store, general-purpose bit 11 = UTF-8.
    const local = concat([
      u32(0x04034b50),
      u16(20), // version needed
      u16(0x0800), // UTF-8
      u16(0), // method: store
      u16(0), // mod time
      u16(0), // mod date
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0), // extra length
      nameBytes,
      data,
    ]);

    entries.push({ path, data, crc, localHeaderOffset: offset });
    locals.push(local);
    offset += local.length;
  }

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.path);
    const size = entry.data.length;
    centrals.push(
      concat([
        u32(0x02014b50),
        u16(20), // version made by
        u16(20), // version needed
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(entry.crc),
        u32(size),
        u32(size),
        u16(nameBytes.length),
        u16(0), // extra
        u16(0), // comment
        u16(0), // disk start
        u16(0), // int attrs
        u32(0), // ext attrs
        u32(entry.localHeaderOffset),
        nameBytes,
      ]),
    );
  }

  const centralDirectory = concat(centrals);
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

  const bytes = concat([...locals, centralDirectory, end]);
  // Copy into a standalone ArrayBuffer so BlobPart typing is satisfied under TS 5.x DOM libs.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: 'application/zip' });
}
