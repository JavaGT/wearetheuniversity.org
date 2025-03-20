import { join } from 'path';
export const ROOT = process.cwd();
export const EMAIL_ATTACHMENT_HOSTED_DIRECTORY = join('email-attachments');
export const EMAIL_ATTACHMENT_OUTPUT_DIRECTORY = join(ROOT, 'docs', EMAIL_ATTACHMENT_HOSTED_DIRECTORY);
export const AUTHOR_DATA_FILE = join(ROOT, 'source', 'authors.json');