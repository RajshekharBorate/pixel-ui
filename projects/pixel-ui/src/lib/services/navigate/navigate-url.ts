import type {
  PixelNavigateRequest,
  PixelNavTarget,
} from './navigate.types';

const NAV_PAIR_SEP = ';';
const NAV_KV_SEP = ':';

function encodePart(value: string): string {
  return encodeURIComponent(value);
}

function decodePart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Serializes one or more targets into the canonical `?nav=` blob. */
export function serializeNavTargets(
  targets: readonly PixelNavTarget[],
): string {
  return targets
    .map((target) => {
      switch (target.type) {
        case 'section':
          return `section${NAV_KV_SEP}${encodePart(target.id)}`;
        case 'selector':
          return `selector${NAV_KV_SEP}${encodePart(target.selector)}`;
        case 'accordion':
          return `accordion${NAV_KV_SEP}${encodePart(target.id)}${NAV_PAIR_SEP}panel${NAV_KV_SEP}${encodePart(target.panelId)}`;
        case 'stepper':
          return `stepper${NAV_KV_SEP}${encodePart(target.id)}${NAV_PAIR_SEP}step${NAV_KV_SEP}${encodePart(String(target.step))}`;
        case 'tabs':
          return `tabs${NAV_KV_SEP}${encodePart(target.id)}${NAV_PAIR_SEP}tab${NAV_KV_SEP}${encodePart(String(target.tab))}`;
        case 'grid-row': {
          const parts = [
            `grid${NAV_KV_SEP}${encodePart(target.gridId)}`,
            `row${NAV_KV_SEP}${encodePart(String(target.rowId))}`,
          ];
          if (target.page != null) {
            parts.push(`page${NAV_KV_SEP}${encodePart(String(target.page))}`);
          }
          return parts.join(NAV_PAIR_SEP);
        }
        case 'wizard': {
          const parts = [`wizard${NAV_KV_SEP}${encodePart(target.id)}`];
          if (target.step != null) {
            parts.push(`step${NAV_KV_SEP}${encodePart(String(target.step))}`);
          }
          return parts.join(NAV_PAIR_SEP);
        }
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('|');
}

function parseNavSegment(segment: string): PixelNavTarget | null {
  const map = new Map<string, string>();
  for (const part of segment.split(NAV_PAIR_SEP)) {
    if (!part) {
      continue;
    }
    const idx = part.indexOf(NAV_KV_SEP);
    if (idx <= 0) {
      continue;
    }
    map.set(part.slice(0, idx), decodePart(part.slice(idx + 1)));
  }

  if (map.has('section')) {
    return { type: 'section', id: map.get('section')! };
  }
  if (map.has('selector')) {
    return { type: 'selector', selector: map.get('selector')! };
  }
  if (map.has('accordion') && map.has('panel')) {
    return { type: 'accordion', id: map.get('accordion')!, panelId: map.get('panel')! };
  }
  if (map.has('stepper') && map.has('step')) {
    const raw = map.get('step')!;
    const asNum = Number(raw);
    return {
      type: 'stepper',
      id: map.get('stepper')!,
      step: Number.isFinite(asNum) && String(asNum) === raw ? asNum : raw,
    };
  }
  if (map.has('tabs') && map.has('tab')) {
    const raw = map.get('tab')!;
    const asNum = Number(raw);
    return {
      type: 'tabs',
      id: map.get('tabs')!,
      tab: Number.isFinite(asNum) && String(asNum) === raw ? asNum : raw,
    };
  }
  if (map.has('grid') && map.has('row')) {
    const pageRaw = map.get('page');
    const page = pageRaw != null ? Number(pageRaw) : undefined;
    return {
      type: 'grid-row',
      gridId: map.get('grid')!,
      rowId: map.get('row')!,
      page: page != null && Number.isFinite(page) ? page : undefined,
    };
  }
  if (map.has('wizard')) {
    const stepRaw = map.get('step');
    let step: string | number | undefined;
    if (stepRaw != null) {
      const asNum = Number(stepRaw);
      step = Number.isFinite(asNum) && String(asNum) === stepRaw ? asNum : stepRaw;
    }
    return { type: 'wizard', id: map.get('wizard')!, step };
  }
  return null;
}

/** Parses a `?nav=` blob into targets (pipe-separated chain). */
export function parseNavParam(nav: string | null | undefined): PixelNavTarget[] {
  if (!nav?.trim()) {
    return [];
  }
  return nav
    .split('|')
    .map((segment) => parseNavSegment(segment.trim()))
    .filter((target): target is PixelNavTarget => target != null);
}

/** Builds a navigate request from a full URL or path+search+hash string. */
export function parseNavigateUrl(
  url: string,
  navParam = 'nav',
  options: { readonly firstClassParams?: boolean } = {},
): PixelNavigateRequest | null {
  try {
    const base =
      typeof location !== 'undefined' ? location.origin : 'http://localhost';
    const parsed = new URL(url, base);
    const nav = parsed.searchParams.get(navParam);
    const targets = parseNavParam(nav);
    const fragment = parsed.hash ? parsed.hash.replace(/^#/, '') : '';
    const firstClass = options.firstClassParams !== false;

    const queryParams: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      if (
        key === navParam ||
        (firstClass && (key === 'row' || key === 'step' || key === 'grid' || key === 'wizard'))
      ) {
        return;
      }
      queryParams[key] = value;
    });

    const pathCommands = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => decodePart(segment));

    const row = firstClass ? parsed.searchParams.get('row') : null;
    const stepRaw = firstClass ? parsed.searchParams.get('step') : null;
    const grid = firstClass ? parsed.searchParams.get('grid') : null;
    const wizard = firstClass ? parsed.searchParams.get('wizard') : null;
    let step: string | number | undefined;
    if (stepRaw != null) {
      const asNum = Number(stepRaw);
      step = Number.isFinite(asNum) && String(asNum) === stepRaw ? asNum : stepRaw;
    }

    const request: PixelNavigateRequest = {
      route: pathCommands.length ? pathCommands : undefined,
      queryParams: Object.keys(queryParams).length ? queryParams : undefined,
      fragment: fragment || undefined,
      target: targets.length === 1 ? targets[0] : targets.length ? targets : undefined,
      nav: nav || undefined,
      row: row ?? undefined,
      step,
      grid: grid ?? undefined,
      wizard: wizard ?? undefined,
      source: 'bootstrap',
    };

    if (
      !request.route &&
      !request.target &&
      !request.fragment &&
      !request.nav &&
      request.row == null &&
      request.step == null &&
      !request.grid &&
      !request.wizard
    ) {
      return null;
    }
    return request;
  } catch {
    return null;
  }
}

/** Serializes a request into a relative URL string (path + query + hash). */
export function navigateRequestToUrl(
  request: PixelNavigateRequest,
  options: {
    readonly navParam?: string;
    readonly basePath?: string;
    readonly firstClassParams?: boolean;
  } = {},
): string {
  const navParam = options.navParam ?? 'nav';
  const firstClass = options.firstClassParams !== false;
  const path =
    request.route?.map((part) => encodePart(String(part))).join('/') ??
    options.basePath?.replace(/^\//, '') ??
    '';

  const params = new URLSearchParams();
  if (request.queryParams) {
    for (const [key, value] of Object.entries(request.queryParams)) {
      if (value === null || value === undefined) {
        continue;
      }
      if (
        firstClass &&
        (key === 'row' || key === 'step' || key === 'grid' || key === 'wizard' || key === navParam)
      ) {
        continue;
      }
      params.set(key, String(value));
    }
  }

  const targets = normalizeTargets(request);
  const navBlob =
    request.nav ??
    (targets.length ? serializeNavTargets(targets) : '');
  if (navBlob) {
    params.set(navParam, navBlob);
  }

  if (firstClass) {
    const gridRow = targets.find((t) => t.type === 'grid-row');
    const wizard = targets.find((t) => t.type === 'wizard');
    const stepper = targets.find((t) => t.type === 'stepper');
    const row = request.row ?? (gridRow && gridRow.type === 'grid-row' ? gridRow.rowId : undefined);
    const step =
      request.step ??
      (wizard && wizard.type === 'wizard'
        ? wizard.step
        : stepper && stepper.type === 'stepper'
          ? stepper.step
          : undefined);
    const grid =
      request.grid ?? (gridRow && gridRow.type === 'grid-row' ? gridRow.gridId : undefined);
    const wizardId =
      request.wizard ?? (wizard && wizard.type === 'wizard' ? wizard.id : undefined);
    if (row != null) params.set('row', String(row));
    if (step != null) params.set('step', String(step));
    if (grid) params.set('grid', grid);
    if (wizardId) params.set('wizard', wizardId);
  }

  const search = params.toString();
  const hash =
    request.fragment ||
    (targets.length === 1 && targets[0].type === 'section' ? targets[0].id : '');

  return `/${path}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
}

/**
 * Builds targets from first-class fields when `nav` / `target` are empty or incomplete.
 */
export function targetsFromFirstClass(request: PixelNavigateRequest): PixelNavTarget[] {
  if (request.wizard) {
    return [{ type: 'wizard', id: request.wizard, step: request.step }];
  }
  if (request.grid && request.row != null) {
    return [{ type: 'grid-row', gridId: request.grid, rowId: request.row }];
  }
  return [];
}

/** Flattens `request.target` / `request.nav` / first-class fields into an ordered target list. */
export function normalizeTargets(request: PixelNavigateRequest): PixelNavTarget[] {
  if (request.nav) {
    const fromNav = parseNavParam(request.nav);
    if (fromNav.length) {
      return fromNav;
    }
  }
  if (request.target) {
    return Array.isArray(request.target)
      ? [...request.target]
      : [request.target as PixelNavTarget];
  }
  const fromFirstClass = targetsFromFirstClass(request);
  if (fromFirstClass.length) {
    return fromFirstClass;
  }
  if (request.fragment) {
    return [{ type: 'section', id: request.fragment }];
  }
  return [];
}

/**
 * Coerces a JSON / string payload (e.g. `notification.data.nav`) into a request.
 * Objects are treated as partial {@link PixelNavigateRequest}; strings as `?nav=` blobs
 * or simple section ids.
 */
export function coerceNavigateRequest(
  value: unknown,
): PixelNavigateRequest | null {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.includes(':') || trimmed.includes('|')) {
      const targets = parseNavParam(trimmed);
      return targets.length
        ? { target: targets.length === 1 ? targets[0] : targets, nav: trimmed }
        : { fragment: trimmed, target: { type: 'section', id: trimmed } };
    }
    return { fragment: trimmed, target: { type: 'section', id: trimmed } };
  }
  if (typeof value === 'object') {
    const record = value as PixelNavigateRequest;
    if (
      record.route ||
      record.target ||
      record.fragment ||
      record.nav ||
      record.queryParams ||
      record.row != null ||
      record.step != null ||
      record.grid ||
      record.wizard
    ) {
      return record;
    }
  }
  return null;
}
