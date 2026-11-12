export const MAX_RESUME_BYTES = 5_000_000;
export function validateResumeSize(size) {
  return Number.isFinite(size) && size > 0 && size < MAX_RESUME_BYTES;
}
