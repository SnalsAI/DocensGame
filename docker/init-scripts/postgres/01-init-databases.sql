-- Create additional databases for services
CREATE DATABASE keycloak;
CREATE DATABASE posthog;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE keycloak TO eduatelier;
GRANT ALL PRIVILEGES ON DATABASE posthog TO eduatelier;
