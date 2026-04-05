type MaybeError = {
  message?: string | null;
  code?: string | null;
} | null | undefined;

export function isMissingProductsImageUrlColumn(error: MaybeError): boolean {
  const message = (error?.message ?? '').toLowerCase();
  if (!message) return false;

  return (
    message.includes("could not find the 'image_url' column of 'products'") ||
    message.includes('products.image_url') ||
    (message.includes('image_url') && message.includes('schema cache'))
  );
}
