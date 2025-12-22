class CustomEncryption {
    constructor() {
        this.saltRounds = 12;
    }

    // Custom hashing algorithm (unchanged)
    async customHash(password) {
        let hash = '';
        for (let i = 0; i < password.length; i++) {
            const charCode = password.charCodeAt(i);
            // Custom transformation: multiply by 3, add salt position, XOR with previous
            const transformed = (charCode * 3 + i) ^ (i > 0 ? hash.charCodeAt(i-1) : 137);
            hash += String.fromCharCode(transformed % 256);
        }
        return this.stringToHex(hash);
    }

    // Custom salt generation (unchanged)
    generateSalt() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let salt = '';
        
        // Use crypto.getRandomValues for better randomness in browsers
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const randomValues = new Uint32Array(16);
            crypto.getRandomValues(randomValues);
            for (let i = 0; i < 16; i++) {
                salt += chars.charAt(randomValues[i] % chars.length);
            }
        } else {
            // Fallback for Node.js and older browsers
            for (let i = 0; i < 16; i++) {
                salt += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        return salt;
    }

    // FIXED: Main encryption function using XOR stream cipher
    async encryptData(data, secretKey) {
        const salt = this.generateSalt();
        const dataString = JSON.stringify(data);
        
        let encrypted = '';
        for (let i = 0; i < dataString.length; i++) {
            const dataChar = dataString.charCodeAt(i);
            const keyChar = secretKey.charCodeAt(i % secretKey.length);
            const saltChar = salt.charCodeAt(i % salt.length);
            
            // XOR encryption: reversible and simple
            const encryptedChar = dataChar ^ keyChar ^ saltChar;
            encrypted += String.fromCharCode(encryptedChar);
        }
        
        const token = this.stringToHex(encrypted) + ':' + this.stringToHex(salt);
        return token;
    }

    // FIXED: Decryption function using XOR (inverse of encryption)
    async decryptData(token, secretKey) {
        try {
            const [encryptedHex, saltHex] = token.split(':');
            const encrypted = this.hexToString(encryptedHex);
            const salt = this.hexToString(saltHex);
            
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                const encryptedChar = encrypted.charCodeAt(i);
                const keyChar = secretKey.charCodeAt(i % secretKey.length);
                const saltChar = salt.charCodeAt(i % salt.length);
                
                // XOR decryption: same operation as encryption
                const decryptedChar = encryptedChar ^ keyChar ^ saltChar;
                
                // Basic validation (optional: ensure printable chars for JSON)
                if (decryptedChar < 0 || decryptedChar > 255) {
                    throw new Error('Invalid character code during decryption');
                }
                
                decrypted += String.fromCharCode(decryptedChar);
            }
            
            return JSON.parse(decrypted);
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    // Browser-compatible utility functions (unchanged)
    stringToHex(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            const hexChar = str.charCodeAt(i).toString(16);
            hex += hexChar.length === 1 ? '0' + hexChar : hexChar;
        }
        return hex;
    }

    hexToString(hex) {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            const hexChar = hex.substr(i, 2);
            const charCode = parseInt(hexChar, 16);
            
            if (isNaN(charCode) || charCode < 0 || charCode > 255) {
                throw new Error('Invalid hex string');
            }
            
            str += String.fromCharCode(charCode);
        }
        return str;
    }

    // Token generation (unchanged)
    async generateToken(userData, secretKey) {
        return await this.encryptData(userData, secretKey);
    }

    // Validate token format (unchanged)
    validateToken(token) {
        if (typeof token !== 'string') return false;
        const parts = token.split(':');
        if (parts.length !== 2) return false;
        
        const [encryptedHex, saltHex] = parts;
        
        // Check if both parts are valid hex strings
        const hexRegex = /^[0-9a-fA-F]+$/;
        return hexRegex.test(encryptedHex) && hexRegex.test(saltHex);
    }

    // Generate user ID (browser compatible) (unchanged)
    generateUserId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 9);
        return 'user_' + timestamp + '_' + randomStr;
    }

    // Password strength validation (unchanged)
    validatePasswordStrength(password) {
        const requirements = {
            minLength: 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const strength = Object.values(requirements).filter(Boolean).length;
        
        return {
            isValid: password.length >= requirements.minLength && strength >= 3,
            strength: strength,
            requirements: requirements
        };
    }
}

// Export for different environments (unchanged)
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = CustomEncryption;
} else if (typeof window !== 'undefined') {
    // Browser environment - attach to window
    window.CustomEncryption = CustomEncryption;
}

const cencryption = new CustomEncryption();
export default cencryption;