export function validateUsername(username: string): boolean {
  const minLength = 3;
  const maxLength = 20;
  const validPattern = /^[a-zA-Z0-9_]+$/;
  return (
    username.length >= minLength &&
    username.length <= maxLength &&
    validPattern.test(username)
  );
}
