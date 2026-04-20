interface ParsedError {
  status: number;
  message: string;
}

export const parseError = (error: unknown): ParsedError => {
  // Default values
  let status = 500;
  let message = 'Internal server error';

  // Check if it's an object
  if (error !== null && typeof error === 'object') {
    // Safely check for status
    if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
      status = (error as { status: number }).status;
    }

    // Safely check for message
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      message = (error as { message: string }).message;
    }
  }

  return { status, message };
};
