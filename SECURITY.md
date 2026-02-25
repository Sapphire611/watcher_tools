# Security Configuration

This document outlines the security measures implemented in Watcher Tools to protect against common Electron security vulnerabilities.

## Content Security Policy (CSP)

### Implemented CSP Directives

The application implements Content Security Policy at two levels:

1. **HTML Meta Tag Level** (in `src/renderer/index.html`)
2. **Session Level** (in `src/main/index.ts`)

### Current CSP Policy

```http
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self' data:;
connect-src 'self' http://localhost:* https://*;
object-src 'none';
```

### Policy Breakdown

- `default-src 'self'`: Only allow resources from the same origin
- `script-src 'self' 'unsafe-inline'`: Allow scripts from same origin and inline scripts (needed for Vue.js development)
- `style-src 'self' 'unsafe-inline'`: Allow styles from same origin and inline styles (needed for Vue.js development)
- `img-src 'self' data:`: Allow images from same origin and data URIs
- `font-src 'self' data:`: Allow fonts from same origin and data URIs
- `connect-src 'self' http://localhost:* https://*`: Allow connections to same origin, localhost (for development), and HTTPS endpoints
- `object-src 'none'`: Block all plugin content (Flash, Java, etc.)

## WebPreferences Security Settings

The following security settings are configured in `webPreferences`:

```typescript
{
  sandbox: false,              // Disabled for IPC communication
  contextIsolation: true,      // Enabled for security
  nodeIntegration: false,      // Disabled for security
  webSecurity: true,           // Enable web security features
  allowRunningInsecureContent: false,  // Block insecure content
  experimentalFeatures: false,         // Disable experimental features
  disableBlinkFeatures: 'Auxclick'     // Disable potentially dangerous features
}
```

## Security Best Practices Implemented

1. **Context Isolation**: Enabled to prevent direct access to Node.js APIs from renderer process
2. **Node Integration**: Disabled to prevent renderer process from accessing Node.js APIs
3. **Web Security**: Enabled to enforce same-origin policy and other web security features
4. **Secure IPC**: Using `contextIsolation: true` with proper preload scripts
5. **External Links**: Opening external URLs in default browser instead of Electron window

## Development vs Production Considerations

### Development Mode

- Allows `http://localhost:*` in connect-src for local API development
- Enables DevTools for debugging

### Production Mode

- More restrictive CSP policies recommended
- DevTools disabled
- Additional security hardening applied

## Recommended Production Enhancements

For production deployment, consider these additional security measures:

1. Remove `'unsafe-inline'` from script-src and style-src
2. Implement strict-dynamic for better script management
3. Add nonce-based script execution
4. Implement subresource integrity checking
5. Add reporting endpoints for CSP violations
6. Consider enabling sandbox mode if IPC is not required

## References

- [Electron Security Documentation](https://www.electronjs.org/docs/latest/tutorial/security)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Electron Security Guide](https://owasp.org/www-community/attacks/Electron_Attack_Surface)
