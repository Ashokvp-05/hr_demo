// Minimal mock of otplib (real package ships ESM that ts-jest won't transform).
// 2FA is not under test here, so no-op implementations are sufficient.
export const generateSecret = () => 'TESTSECRET';
export const generateURI = () => 'otpauth://totp/test';
export const verifySync = () => true;
export default { generateSecret, generateURI, verifySync };
