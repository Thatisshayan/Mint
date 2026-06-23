export async function getCurrentUser(request: any) {
  return request.user || null;
}
