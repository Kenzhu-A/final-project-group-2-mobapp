// [PET-NAME-VALIDATION] Shared rules for adoption listing pet names.
export const PET_NAME_MAX_LENGTH = 50;
export const PET_NAME_ERROR = `Pet names can only use letters and spaces, up to ${PET_NAME_MAX_LENGTH} characters.`;

const PET_NAME_PATTERN = /^[A-Za-z ]+$/;

export function sanitizePetName(value: string): string {
  return value.replace(/[^A-Za-z ]/g, "").slice(0, PET_NAME_MAX_LENGTH);
}

export function validatePetName(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Pet name is required.";
  }

  if (trimmed.length > PET_NAME_MAX_LENGTH || !PET_NAME_PATTERN.test(trimmed)) {
    return PET_NAME_ERROR;
  }

  return null;
}
