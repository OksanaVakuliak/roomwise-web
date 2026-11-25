type EmptyResult = { error?: unknown; response: { status: number } };

export const acknowledged = (result: EmptyResult) => ({
  ...result,
  data: result.response.status < 400 ? true : undefined,
});
