import { generateSecret as generateSecretOTP, generateURI, verifySync } from 'otplib';
import qrcode from 'qrcode';

export const generateSecret = (email: string) => {
    const secret = generateSecretOTP();
    const otpauth = generateURI({
        issuer: 'Rudratic HR Management',
        label: email,
        secret,
    });
    return { secret, otpauth };
};

export const generateQRCode = async (otpauth: string) => {
    return qrcode.toDataURL(otpauth);
};

export const verifyToken = (token: string, secret: string) => {
    try {
        const { valid } = verifySync({ token, secret });
        return valid;
    } catch (error) {
        return false;
    }
};

export const validateToken = (token: string, secret: string) => {
    return verifyToken(token, secret);
};
