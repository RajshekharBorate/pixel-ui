import type { PixelPermissionCatalog, PixelPolicy } from 'pixel-ui';

/** Shared catalog for Authorization docs examples and the app-shell playground. */
export const AUTH_DEMO_CATALOG: PixelPermissionCatalog = {
  version: 'demo-2',
  roles: {
    viewer: ['claims:read', 'nav:workspace'],
    exporter: ['claims:read', 'claims:export', 'nav:workspace'],
    adjuster: ['claims:read', 'claims:export', 'claims:approve', 'nav:workspace'],
    admin: [
      'claims:read',
      'claims:export',
      'claims:approve',
      'claims:amend',
      'settings:view',
      'admin:panel',
      'nav:workspace',
      'nav:admin',
    ],
  },
  permissions: {
    'claims:read': { description: 'Read claims' },
    'claims:export': { description: 'Export claims' },
    'claims:approve': { description: 'Approve claims' },
    'claims:amend': { description: 'Open claim amendment wizard' },
    'settings:view': { description: 'View settings / security' },
    'admin:panel': { description: 'Admin chrome' },
    'nav:workspace': { description: 'Workspace nav' },
    'nav:admin': { description: 'Admin nav branch' },
  },
};

/** SoD + amount + tenant sample policies for ABAC demos. */
export const AUTH_DEMO_POLICIES: readonly PixelPolicy[] = [
  {
    id: 'deny-self-approve',
    description: 'Separation of duties — cannot approve own claim',
    effect: 'deny',
    target: { actions: ['approve'], permissions: ['claims:approve'] },
    condition: { eq: ['subject.id', 'resource.attributes.createdBy'] },
  },
  {
    id: 'allow-approve-others',
    effect: 'allow',
    target: { permissions: ['claims:approve'] },
    condition: { neq: ['subject.id', 'resource.attributes.createdBy'] },
  },
  {
    id: 'allow-export-under-limit',
    effect: 'allow',
    target: { permissions: ['claims:export'] },
    condition: { lt: ['resource.attributes.amount', 10000] },
  },
];

export type AuthDemoRole = 'viewer' | 'exporter' | 'adjuster' | 'admin';

export const AUTH_DEMO_ROLE_OPTIONS: readonly { value: AuthDemoRole; label: string }[] = [
  { value: 'viewer', label: 'Viewer — read only' },
  { value: 'exporter', label: 'Exporter — can export' },
  { value: 'adjuster', label: 'Adjuster — export and approve' },
  { value: 'admin', label: 'Admin — full access' },
];

/** One-line “who am I?” copy for live examples. */
export function authDemoRoleBlurb(role: AuthDemoRole): string {
  switch (role) {
    case 'viewer':
      return 'You are a Viewer: you can read claims, but you cannot export, approve, or open admin tools.';
    case 'exporter':
      return 'You are an Exporter: you can read and export claims. You cannot approve or amend.';
    case 'adjuster':
      return 'You are an Adjuster: you can export and approve other people’s claims (not your own).';
    case 'admin':
      return 'You are an Admin: export, approve, amend, settings, and admin chrome are allowed.';
  }
}
