/**
 * Shared styles for Authorization docs examples (compact, token-based).
 */
export const AUTH_DEMO_STYLES = `
  .hint,
  .info,
  .expect,
  .who {
    margin: 0 0 0.75rem;
    color: var(--pixel-sys-on-surface-variant, #44474f);
    font-size: 0.875rem;
    line-height: 1.45;
  }
  .who {
    font-weight: 600;
    color: var(--pixel-sys-on-surface, #1a1b1f);
  }
  .expect {
    margin-block-start: 0.5rem;
    margin-block-end: 0;
  }
  ul.hint {
    padding-inline-start: 1.25rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    margin-block-end: 0.75rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block-end: 0.75rem;
  }
  .panel {
    padding: 0.75rem 1rem;
    border: 1px solid var(--pixel-sys-outline-variant, #ccc);
    border-radius: 0.5rem;
    background: var(--pixel-sys-surface, #fff);
    margin-block-end: 0.75rem;
  }
  .panel h3,
  .panel h4 {
    margin: 0 0 0.5rem;
    font-size: 0.9375rem;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .nav-demo {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .nav-demo li {
    padding: 0.35rem 0;
  }
  .nav-demo .child {
    padding-inline-start: 1rem;
    color: var(--pixel-sys-on-surface-variant, #444);
    font-size: 0.875rem;
  }
`;
