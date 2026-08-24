# Composition plan — Settings wizard (PAGE)

**Run:** `golden-settings-wizard-page`  
**Approved:** true

## Purpose

Linear settings wizard: profile → preferences → review.

## Component tree

```text
docs-settings-wizard-playground
├── header + pixel-button (Reset)
└── pixel-stepper type="wizard"
    ├── pixel-step Profile → pixel-input + pixel-select
    ├── pixel-step Preferences → pixel-toggle ×2
    └── pixel-step Review → summary list
```

## States

- Loading: stepper `showSkeleton`
- Finish: polite status message
- Tokens: `--pixel-sys-*` only

## Forbidden

- Invented stepper types / hardcoded colors / CDK
