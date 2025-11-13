# Environment Configuration

This directory contains environment-specific configuration files for the Hydraulic Network Web Application.

## Structure

```
environments/
├── README.md                 # This file
├── development/              # Development environment
│   ├── .env                  # Development environment variables
│   ├── config.json           # Development configuration
│   └── docker-compose.yml    # Development Docker Compose
├── staging/                  # Staging environment
│   ├── .env                  # Staging environment variables
│   ├── config.json           # Staging configuration
│   └── docker-compose.yml    # Staging Docker Compose
├── production/               # Production environment
│   ├── .env                  # Production environment variables
│   ├── config.json           # Production configuration
│   └── docker-compose.yml    # Production Docker Compose
└── templates/                # Configuration templates
    ├── .env.template         # Environment variable template
    ├── config.template.json  # Configuration template
    └── docker.template.yml   # Docker Compose template
```

## Environment Descriptions

### Development Environment

The development environment is optimized for local development with debugging enabled and relaxed security settings.

**Key Features:**
- Debug logging enabled
- Hot module replacement
- Mock data support
- Development tools integration
- Relaxed CORS policies
- Local API endpoints

### Staging Environment

The staging environment mirrors production for testing and validation purposes.

**Key Features:**
- Production-like configuration
- Limited external integrations
- Test data and users
- Monitoring and logging
- Security features enabled
- Performance testing capabilities

### Production Environment

The production environment is optimized for performance, security, and reliability.

**Key Features:**
- Optimized builds
- Security headers enabled
- CDN integration
- Performance monitoring
- Error tracking
- SSL/TLS configuration
- Load balancing
- High availability setup

## Usage

### Local Development

1. Copy the development environment:
   ```bash
   cp -r environments/development/* .
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Docker Development

1. Use the development Docker Compose:
   ```bash
   docker-compose -f environments/development/docker-compose.yml up
   ```

### Environment Variables

Each environment has specific environment variables defined in `.env` files:

- **Development**: Local URLs, debug features, mock data
- **Staging**: Staging URLs, limited production features
- **Production**: Production URLs, optimized settings, security features

## Configuration Management

### Template System

Configuration templates in the `templates/` directory provide a base structure that can be customized for each environment.

### Environment-Specific Overrides

Each environment can override specific configuration values while inheriting common settings.

### Secrets Management

Sensitive information should be managed through:
- Environment variables
- Docker secrets (for Docker deployments)
- Vault or similar secret management systems
- CI/CD secret storage

## Best Practices

### Configuration Separation

- Keep environment-specific configuration separate
- Use consistent naming conventions
- Document all configuration options
- Validate configuration at startup

### Security

- Never commit secrets to version control
- Use strong, unique values for each environment
- Rotate secrets regularly
- Limit access to production configurations

### Performance

- Optimize configuration for each environment's requirements
- Use appropriate caching strategies
- Configure resource limits and requests
- Monitor and tune performance

### Monitoring

- Configure appropriate logging levels
- Set up health checks
- Monitor resource usage
- Track application metrics

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Check `.env` file syntax
   - Verify file is in correct location
   - Restart development server

2. **Configuration Validation Errors**
   - Check configuration file syntax
   - Validate required fields
   - Check environment variable references

3. **Docker Configuration Issues**
   - Verify Docker Compose syntax
   - Check volume mounts
   - Validate environment variable passing

### Debug Mode

Enable debug mode to get detailed configuration information:

```bash
DEBUG=config npm run dev
```

### Configuration Validation

Validate configuration with:

```bash
npm run validate:config
```

## Maintenance

### Regular Updates

- Review and update configuration regularly
- Update security settings
- Optimize performance settings
- Remove unused configuration

### Version Control

- Track configuration changes in version control
- Use meaningful commit messages
- Document breaking changes
- Maintain configuration history

### Documentation

- Keep configuration documentation up to date
- Document environment differences
- Provide usage examples
- Maintain troubleshooting guides

## Support

For configuration-related issues:

1. Check this documentation
2. Review environment-specific README files
3. Check application logs
4. Contact the development team

## Additional Resources

- [Main Application README](../README.md)
- [Development Guide](../docs/DEVELOPMENT.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Troubleshooting Guide](../docs/TROUBLESHOOTING.md)