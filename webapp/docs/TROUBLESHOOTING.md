# Troubleshooting Guide

This guide provides solutions to common issues you may encounter while using or developing the Hydraulic Network Web Application.

## Table of Contents

- [General Issues](#general-issues)
- [Installation Problems](#installation-problems)
- [Configuration Issues](#configuration-issues)
- [Calculation Problems](#calculation-problems)
- [Performance Issues](#performance-issues)
- [Browser Compatibility](#browser-compatibility)
- [Development Issues](#development-issues)
- [Deployment Issues](#deployment-issues)
- [API Issues](#api-issues)
- [Security Issues](#security-issues)
- [Network Issues](#network-issues)
- [Getting Help](#getting-help)

## General Issues

### Application Won't Start

**Problem**: The application fails to start or shows a blank screen.

**Solutions**:
1. **Check Node.js version**:
   ```bash
   node --version
   # Should be 18.0 or higher
   ```

2. **Clear cache and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

3. **Check environment variables**:
   ```bash
   # Ensure .env file exists and has required variables
   cat .env
   ```

4. **Check port availability**:
   ```bash
   # Check if port 3000 is in use
   lsof -i :3000
   # Kill process if needed
   kill -9 <PID>
   ```

### White Screen of Death

**Problem**: Application loads but shows a white screen with no errors.

**Solutions**:
1. **Check browser console**:
   - Open browser developer tools (F12)
   - Check Console tab for JavaScript errors
   - Check Network tab for failed requests

2. **Check for syntax errors**:
   ```bash
   npm run type-check
   npm run lint
   ```

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear site data in browser settings

### Memory Issues

**Problem**: Application uses too much memory or crashes.

**Solutions**:
1. **Increase Node.js memory limit**:
   ```bash
   # In package.json scripts, change:
   "dev": "NODE_OPTIONS='--max-old-space-size=4096' vite"
   ```

2. **Check for memory leaks**:
   - Use browser developer tools Memory tab
   - Monitor memory usage over time
   - Look for retained DOM nodes

3. **Optimize bundle size**:
   ```bash
   npm run build
   npm run analyze
   ```

## Installation Problems

### npm Install Fails

**Problem**: `npm install` fails with various errors.

**Solutions**:
1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

2. **Use npm instead of yarn** (or vice versa):
   ```bash
   # If using yarn
   rm yarn.lock
   npm install
   
   # If using npm
   rm package-lock.json
   yarn install
   ```

3. **Check npm registry**:
   ```bash
   npm config get registry
   # Should be: https://registry.npmjs.org/
   
   # Reset if needed
   npm config set registry https://registry.npmjs.org/
   ```

4. **Install with verbose output**:
   ```bash
   npm install --verbose
   ```

### Module Not Found Errors

**Problem**: Import errors for modules that should be installed.

**Solutions**:
1. **Check if module is installed**:
   ```bash
   npm list <module-name>
   ```

2. **Reinstall specific module**:
   ```bash
   npm uninstall <module-name>
   npm install <module-name>
   ```

3. **Check TypeScript paths**:
   - Verify `tsconfig.json` paths configuration
   - Check if aliases are properly configured

### TypeScript Compilation Errors

**Problem**: TypeScript compilation fails with type errors.

**Solutions**:
1. **Check TypeScript version**:
   ```bash
   npx tsc --version
   ```

2. **Update type definitions**:
   ```bash
   npm install --save-dev @types/node @types/react @types/react-dom
   ```

3. **Skip type check temporarily**:
   ```bash
   # Add to package.json scripts
   "dev:skip-types": "vite --no-ts-check"
   ```

## Configuration Issues

### Environment Variables Not Loading

**Problem**: Environment variables from `.env` file are not available.

**Solutions**:
1. **Check file naming**:
   - Use `.env.local` for local development
   - Use `.env.production` for production
   - Ensure file is in root directory

2. **Check variable naming**:
   - Variables must start with `VITE_` to be accessible in client code
   - Restart development server after changes

3. **Debug environment variables**:
   ```typescript
   // Add to any component temporarily
   console.log('Environment variables:', import.meta.env);
   ```

### API Connection Issues

**Problem**: Cannot connect to API backend.

**Solutions**:
1. **Check API URL configuration**:
   ```typescript
   // In browser console
   console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
   ```

2. **Test API connectivity**:
   ```bash
   curl -v http://localhost:8000/health
   ```

3. **Check CORS settings**:
   - Ensure backend allows frontend origin
   - Check browser console for CORS errors

### WebSocket Connection Failures

**Problem**: WebSocket connections fail or disconnect frequently.

**Solutions**:
1. **Check WebSocket URL**:
   ```typescript
   console.log('WebSocket URL:', import.meta.env.VITE_WEBSOCKET_URL);
   ```

2. **Verify backend WebSocket server**:
   - Ensure backend WebSocket server is running
   - Check WebSocket endpoint accessibility

3. **Check firewall settings**:
   - Ensure WebSocket ports are not blocked
   - Check corporate firewall rules

## Calculation Problems

### Calculations Never Complete

**Problem**: Calculations start but never finish or show as running indefinitely.

**Solutions**:
1. **Check calculation logs**:
   - Open browser developer tools
   - Monitor network requests for calculation status
   - Check console for WebSocket errors

2. **Verify calculation configuration**:
   - Ensure all required fields are filled
   - Check for invalid values (negative numbers, zeros where positive required)

3. **Restart calculation**:
   - Cancel current calculation
   - Verify configuration
   - Start new calculation

### Invalid Calculation Results

**Problem**: Calculation completes but results are incorrect or unrealistic.

**Solutions**:
1. **Verify input data**:
   - Check fluid properties (density, viscosity)
   - Verify pipe dimensions (diameter, length)
   - Ensure units are consistent

2. **Check calculation model**:
   - Verify selected calculation model is appropriate
   - Check boundary conditions
   - Review convergence settings

3. **Compare with known values**:
   - Use simple test cases with known solutions
   - Verify against manual calculations
   - Check against other software

### Error Messages During Calculation

**Problem**: Specific error messages appear during calculation.

**Common Errors and Solutions**:

1. **"Convergence failed"**:
   - Increase maximum iterations
   - Adjust convergence tolerance
   - Check initial conditions
   - Verify fluid properties

2. **"Invalid pipe configuration"**:
   - Check pipe diameters are positive
   - Verify pipe lengths are reasonable
   - Ensure no duplicate pipe IDs

3. **"Boundary conditions incompatible"**:
   - Verify pressure boundary conditions
   - Check flow direction settings
   - Ensure inlet pressure > outlet pressure

## Performance Issues

### Slow Application Performance

**Problem**: Application is slow to respond or load.

**Solutions**:
1. **Check browser performance**:
   - Open browser developer tools Performance tab
   - Record performance profile
   - Identify bottlenecks

2. **Optimize network requests**:
   - Check for excessive API calls
   - Verify data is properly cached
   - Minimize payload sizes

3. **Reduce component complexity**:
   - Implement virtual scrolling for large lists
   - Use React.memo for expensive components
   - Implement lazy loading

### Memory Leaks

**Problem**: Application memory usage increases over time.

**Solutions**:
1. **Check for event listener leaks**:
   ```typescript
   // Ensure cleanup in useEffect
   useEffect(() => {
     const handler = () => { /* handler */ };
     window.addEventListener('event', handler);
     
     return () => {
       window.removeEventListener('event', handler);
     };
   }, []);
   ```

2. **Check for subscription leaks**:
   - Ensure WebSocket subscriptions are cleaned up
   - Unsubscribe from observables
   - Clear intervals and timeouts

3. **Monitor memory usage**:
   - Use browser Memory tab
   - Take heap snapshots
   - Compare snapshots over time

### Bundle Size Issues

**Problem**: Application bundle is too large, causing slow load times.

**Solutions**:
1. **Analyze bundle**:
   ```bash
   npm run build
   npm run analyze
   ```

2. **Implement code splitting**:
   ```typescript
   // Use React.lazy for route-based splitting
   const LazyComponent = lazy(() => import('./Component'));
   ```

3. **Remove unused dependencies**:
   ```bash
   # Check for unused dependencies
   npx depcheck
   ```

## Browser Compatibility

### Internet Explorer Issues

**Problem**: Application doesn't work in Internet Explorer.

**Solutions**:
1. **Add polyfills**:
   ```bash
   npm install core-js
   ```

2. **Update build configuration**:
   ```javascript
   // In vite.config.js
   target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14']
   ```

3. **Consider dropping IE support**:
   - IE is no longer supported by Microsoft
   - Modern browsers provide better performance and security

### Safari Issues

**Problem**: Application has issues in Safari browser.

**Solutions**:
1. **Check for Safari-specific bugs**:
   - Test in Safari Technology Preview
   - Check Safari Web Inspector for errors
   - Verify CSS properties are supported

2. **Fix common Safari issues**:
   ```css
   /* Safari flexbox fixes */
   .container {
     display: flex;
     flex-wrap: wrap; /* Prevents Safari flex bugs */
   }
   
   /* Safari CSS variable support */
   :root {
     --main-color: #1976d2;
   }
   .element {
     color: var(--main-color);
   }
   ```

### Mobile Browser Issues

**Problem**: Application doesn't work properly on mobile devices.

**Solutions**:
1. **Check viewport configuration**:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1">
   ```

2. **Test touch interactions**:
   - Ensure buttons are large enough for touch
   - Verify touch events work properly
   - Test on actual devices, not just emulators

3. **Optimize for mobile performance**:
   - Reduce bundle size
   - Implement lazy loading
   - Optimize images for mobile

## Development Issues

### Hot Module Replacement (HMR) Not Working

**Problem**: Changes don't reflect in browser without full reload.

**Solutions**:
1. **Check Vite configuration**:
   ```javascript
   // In vite.config.js
   export default defineConfig({
     server: {
       hmr: {
         overlay: true
       }
     }
   });
   ```

2. **Restart development server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R
   - Clear site data

### ESLint/Prettier Issues

**Problem**: Linting and formatting don't work properly.

**Solutions**:
1. **Check VS Code extensions**:
   - Ensure ESLint and Prettier extensions are installed
   - Configure VS Code settings:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

2. **Reset ESLint cache**:
   ```bash
   npx eslint --cache --cache-location node_modules/.cache/eslint . --fix
   ```

### TypeScript Errors in Development

**Problem**: TypeScript shows errors that don't make sense.

**Solutions**:
1. **Restart TypeScript service**:
   - In VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
   - Or restart VS Code

2. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true,
       "esModuleInterop": true
     }
   }
   ```

## Deployment Issues

### Build Fails in Production

**Problem**: Application builds locally but fails in production.

**Solutions**:
1. **Check environment differences**:
   ```bash
   # Test production build locally
   npm run build
   npm run preview
   ```

2. **Verify environment variables**:
   - Ensure all required environment variables are set
   - Check for development-only code

3. **Check for platform-specific issues**:
   ```bash
   # Build with target platform
   npm run build -- --mode production
   ```

### Docker Deployment Issues

**Problem**: Docker container fails to start or has issues.

**Solutions**:
1. **Check Docker logs**:
   ```bash
   docker logs <container-name>
   ```

2. **Verify Dockerfile**:
   ```dockerfile
   # Ensure proper working directory
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   
   # Install dependencies
   RUN npm ci --only=production
   ```

3. **Check port bindings**:
   ```bash
   docker ps  # Check if container is running
   docker port <container-name>  # Check port mappings
   ```

### Nginx Configuration Issues

**Problem**: Nginx serves the application incorrectly.

**Solutions**:
1. **Check Nginx configuration**:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     root /var/www/html;
     index index.html;
     
     location / {
       try_files $uri $uri/ /index.html;
     }
   }
   ```

2. **Verify file permissions**:
   ```bash
   chmod -R 755 /var/www/html
   chown -R www-data:www-data /var/www/html
   ```

## API Issues

### CORS Errors

**Problem**: Cross-Origin Resource Sharing errors prevent API access.

**Solutions**:
1. **Configure CORS on backend**:
   ```javascript
   app.use(cors({
     origin: ['http://localhost:3000', 'https://yourdomain.com'],
     credentials: true
   }));
   ```

2. **Check preflight requests**:
   - Ensure OPTIONS requests are handled
   - Verify allowed methods and headers

### Authentication Failures

**Problem**: API authentication fails or tokens expire.

**Solutions**:
1. **Check token validity**:
   ```javascript
   // Verify token format and expiration
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Token expires:', new Date(payload.exp * 1000));
   ```

2. **Implement token refresh**:
   ```javascript
   // Automatic token refresh logic
   api.interceptors.response.use(
     response => response,
     async error => {
       if (error.response?.status === 401) {
         await refreshToken();
         return api.request(error.config);
       }
       throw error;
     }
   );
   ```

### Rate Limiting Issues

**Problem**: API requests are being rate limited.

**Solutions**:
1. **Implement request queuing**:
   ```javascript
   // Queue requests and space them out
   const queueRequest = async (request) => {
     await new Promise(resolve => setTimeout(resolve, 100));
     return request();
   };
   ```

2. **Add retry logic**:
   ```javascript
   const retryRequest = async (request, retries = 3) => {
     try {
       return await request();
     } catch (error) {
       if (error.response?.status === 429 && retries > 0) {
         await new Promise(resolve => setTimeout(resolve, 1000));
         return retryRequest(request, retries - 1);
       }
       throw error;
     }
   };
   ```

## Security Issues

### Content Security Policy Violations

**Problem**: CSP blocks legitimate resources.

**Solutions**:
1. **Check CSP headers**:
   ```javascript
   // Add CSP violation listener
   window.addEventListener('securitypolicyviolation', (e) => {
     console.error('CSP Violation:', e);
   });
   ```

2. **Update CSP directives**:
   ```javascript
   // Add trusted domains to CSP
   const csp = {
     directives: {
       scriptSrc: ["'self'", "*.trusted-domain.com"],
       styleSrc: ["'self'", "'unsafe-inline'"],
       imgSrc: ["'self'", "data:", "*.trusted-domain.com"]
     }
   };
   ```

### Mixed Content Warnings

**Problem**: HTTPS page loads HTTP resources.

**Solutions**:
1. **Update resource URLs**:
   ```html
   <!-- Change this -->
   <script src="http://example.com/script.js"></script>
   
   <!-- To this -->
   <script src="https://example.com/script.js"></script>
   ```

2. **Use protocol-relative URLs**:
   ```html
   <script src="//example.com/script.js"></script>
   ```

## Network Issues

### Slow Network Performance

**Problem**: Application is slow due to network issues.

**Solutions**:
1. **Enable compression**:
   ```javascript
   // In Express app
   app.use(compression());
   ```

2. **Implement caching**:
   ```javascript
   app.use((req, res, next) => {
     res.set('Cache-Control', 'public, max-age=3600');
     next();
   });
   ```

3. **Use CDN for static assets**:
   ```html
   <link rel="stylesheet" href="https://cdn.example.com/styles.css">
   ```

### WebSocket Connection Issues

**Problem**: WebSocket connections fail or disconnect.

**Solutions**:
1. **Implement reconnection logic**:
   ```javascript
   class WebSocketManager {
     constructor(url) {
       this.url = url;
       this.reconnectInterval = 5000;
       this.connect();
     }
     
     connect() {
       this.socket = new WebSocket(this.url);
       
       this.socket.onopen = () => {
         console.log('WebSocket connected');
       };
       
       this.socket.onclose = () => {
         console.log('WebSocket disconnected, retrying...');
         setTimeout(() => this.connect(), this.reconnectInterval);
       };
     }
   }
   ```

2. **Check firewall and proxy settings**:
   - Ensure WebSocket ports are not blocked
   - Configure proxy for WebSocket support

## Getting Help

### Documentation

- **[Main Documentation](../README.md)**: Complete application documentation
- **[Development Guide](DEVELOPMENT.md)**: Development setup and guidelines
- **[API Reference](API_REFERENCE.md)**: API integration documentation
- **[User Guide](user/USER_GUIDE.md)**: User documentation and tutorials

### Debug Mode

Enable debug mode for detailed error information:

```bash
# Set environment variable
VITE_DEBUG_MODE=true
npm run dev
```

### Log Files

Check application logs for detailed error information:

```bash
# Development logs
npm run dev 2>&1 | tee debug.log

# Production logs (Docker)
docker logs <container-name>

# Production logs (systemd)
sudo journalctl -u hydraulic-webapp -f
```

### Community Support

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Stack Overflow**: Search for existing solutions
- **Discord/Slack**: Real-time community chat

### Professional Support

For enterprise support, custom development, or consulting services:

- **Email**: support@hydraulicapp.com
- **Phone**: +1-555-HYDRO-APP
- **Business Hours**: Monday-Friday, 9 AM - 6 PM EST

### Emergency Contacts

For critical issues requiring immediate attention:

- **24/7 Support**: +1-555-EMERGENCY
- **Email**: emergency@hydraulicapp.com
- **Status Page**: https://status.hydraulicapp.com

### Contributing to Solutions

If you find a solution to a problem:

1. **Document the solution** in this guide
2. **Submit a pull request** with improvements
3. **Share your experience** in discussions
4. **Help other users** in community forums

---

**Remember**: Most issues have already been encountered and solved by someone else. Always check the documentation and community resources first. If you can't find a solution, don't hesitate to reach out for help!