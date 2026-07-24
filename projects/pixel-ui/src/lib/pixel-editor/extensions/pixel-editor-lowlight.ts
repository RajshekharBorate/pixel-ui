import { common, createLowlight } from 'lowlight';

/** Shared lowlight instance with the common grammar set (optional peer). */
export const pixelEditorLowlight = createLowlight(common);

/** Languages offered in the Insert → Code block submenu. */
export const PIXEL_EDITOR_CODE_LANGUAGES: readonly {
  readonly id: string;
  readonly label: string;
}[] = [
  { id: '', label: 'Plain text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'json', label: 'JSON' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'python', label: 'Python' },
  { id: 'bash', label: 'Bash' },
  { id: 'sql', label: 'SQL' },
];
