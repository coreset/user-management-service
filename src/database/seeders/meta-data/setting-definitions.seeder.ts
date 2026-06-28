import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { SettingDefinition } from '../../../modules/realms/entities/setting-definition.entity';

type SettingSeed = {
  key: string;
  type: string;
  default?: string | null;
  encrypted?: boolean;
  description?: string;
};

// ---- Allowed REALM_SETTINGS keys ------------------------------------------
const SETTING_DEFINITIONS: SettingSeed[] = [
  // registration & email verification
  { key: 'allow_user_registration', type: 'boolean', default: 'true', description: 'Allow users to self-register' },
  { key: 'require_email_verification', type: 'boolean', default: 'true', description: 'Require email verification before login' },
  { key: 'email_verification_expiry', type: 'int', default: '86400', description: 'Email verification link expiry (seconds)' },
  { key: 'registration_email_validation', type: 'boolean', default: 'true', description: 'Validate email on registration' },
  { key: 'registration_terms_required', type: 'boolean', default: 'true', description: 'Require terms acceptance' },
  // password policy
  { key: 'password_policy', type: 'string', default: 'min8:uppercase:lowercase:digits:special', description: 'Password complexity rules' },
  { key: 'password_history_count', type: 'int', default: '5', description: 'Number of previous passwords to remember' },
  { key: 'password_expiry_days', type: 'int', default: '90', description: 'Password validity period (days)' },
  // login security
  { key: 'max_login_attempts', type: 'int', default: '5', description: 'Failed login attempts before lockout' },
  { key: 'lockout_duration_seconds', type: 'int', default: '900', description: 'Account lockout duration (seconds)' },
  { key: 'mfa_required', type: 'boolean', default: 'false', description: 'Require multi-factor authentication' },
  { key: 'mfa_enabled_methods', type: 'json', default: '["totp","sms","email"]', description: 'Allowed MFA methods' },
  // sessions
  { key: 'session_timeout_seconds', type: 'int', default: '28800', description: 'Session timeout (seconds)' },
  { key: 'remember_me_duration_days', type: 'int', default: '30', description: 'Session duration with remember me' },
  { key: 'idle_session_timeout', type: 'int', default: '1800', description: 'Session idle timeout (seconds)' },
  { key: 'max_active_sessions_per_user', type: 'int', default: '5', description: 'Max concurrent sessions per user' },
  { key: 'session_invalidation_on_password_change', type: 'boolean', default: 'true', description: 'Invalidate sessions on password change' },
  // login methods
  { key: 'login_with_username', type: 'boolean', default: 'true', description: 'Allow login with username' },
  { key: 'login_with_email', type: 'boolean', default: 'true', description: 'Allow login with email' },
  { key: 'login_with_phone', type: 'boolean', default: 'false', description: 'Allow login with phone number' },
  { key: 'email_as_username', type: 'boolean', default: 'true', description: 'Use email as username' },
  { key: 'username_min_length', type: 'int', default: '3', description: 'Minimum username length' },
  { key: 'username_max_length', type: 'int', default: '64', description: 'Maximum username length' },
  // tokens
  { key: 'access_token_lifespan', type: 'int', default: '3600', description: 'Access token validity (seconds)' },
  { key: 'refresh_token_lifespan', type: 'int', default: '604800', description: 'Refresh token validity (seconds)' },
  { key: 'refresh_token_max_usage', type: 'int', default: '100', description: 'Maximum refresh token usage' },
  { key: 'authorization_code_lifespan', type: 'int', default: '600', description: 'Auth code validity (seconds)' },
  { key: 'id_token_lifespan', type: 'int', default: '3600', description: 'ID token validity (seconds)' },
  { key: 'token_issuer', type: 'string', default: null, description: 'Token issuer URL' },
  { key: 'jwt_algorithm', type: 'string', default: 'RS256', description: 'JWT signing algorithm' },
  { key: 'jwt_audience', type: 'json', default: null, description: 'Allowed token audiences' },
  // user profile defaults
  { key: 'default_user_role', type: 'string', default: 'user', description: 'Default role for new users' },
  { key: 'default_user_attributes', type: 'json', default: '{"locale":"en","timezone":"UTC"}', description: 'Default user attributes' },
  { key: 'user_profile_required_fields', type: 'json', default: '["firstName","lastName","email"]', description: 'Required profile fields' },
  // social login
  { key: 'social_login_enabled', type: 'boolean', default: 'true', description: 'Enable social login' },
  { key: 'social_login_providers', type: 'json', default: '["google"]', description: 'Enabled social providers' },
  // captcha
  { key: 'captcha_enabled', type: 'boolean', default: 'false', description: 'Enable captcha on login/registration' },
  { key: 'captcha_provider', type: 'string', default: 'recaptcha_v3', description: 'Captcha service provider' },
  // branding / UI
  { key: 'theme_name', type: 'string', default: 'default', description: 'UI theme name' },
  { key: 'branding_logo_url', type: 'string', default: null, description: 'Custom logo URL' },
  { key: 'branding_primary_color', type: 'string', default: '#0066CC', description: 'Primary brand color' },
  { key: 'custom_css', type: 'text', default: null, description: 'Custom CSS for login pages' },
  { key: 'ui_locales', type: 'json', default: '["en"]', description: 'Supported UI locales' },
  { key: 'default_locale', type: 'string', default: 'en', description: 'Default UI language' },
  // email / SMTP
  { key: 'smtp_host', type: 'string', default: null, description: 'SMTP server host' },
  { key: 'smtp_port', type: 'int', default: '587', description: 'SMTP server port' },
  { key: 'smtp_use_tls', type: 'boolean', default: 'true', description: 'Use TLS for SMTP' },
  { key: 'smtp_username', type: 'string', default: null, description: 'SMTP authentication user' },
  { key: 'smtp_password', type: 'string', default: null, encrypted: true, description: 'SMTP password (encrypted)' },
  { key: 'email_from_address', type: 'string', default: null, description: 'From email address' },
  { key: 'email_from_name', type: 'string', default: null, description: 'From display name' },
  { key: 'email_templates_enabled', type: 'boolean', default: 'true', description: 'Enable email templates' },
  // security
  { key: 'xss_protection_enabled', type: 'boolean', default: 'true', description: 'Enable XSS protection' },
  { key: 'csrf_protection_enabled', type: 'boolean', default: 'true', description: 'Enable CSRF protection' },
  { key: 'rate_limiting_enabled', type: 'boolean', default: 'true', description: 'Enable rate limiting' },
  { key: 'rate_limit_requests', type: 'int', default: '100', description: 'Max requests per minute' },
  { key: 'ip_whitelist_enabled', type: 'boolean', default: 'false', description: 'Enable IP whitelisting' },
  { key: 'ip_whitelist', type: 'json', default: '[]', description: 'Whitelisted IP ranges' },
  { key: 'ip_blacklist', type: 'json', default: '[]', description: 'Blacklisted IP addresses' },
  { key: 'geo_blocking_enabled', type: 'boolean', default: 'false', description: 'Enable country blocking' },
  { key: 'blocked_countries', type: 'json', default: '[]', description: 'Blocked country codes' },
  // api / cors
  { key: 'api_rate_limit_public', type: 'int', default: '1000', description: 'Public API rate limit' },
  { key: 'api_rate_limit_authenticated', type: 'int', default: '5000', description: 'Authenticated API rate limit' },
  { key: 'cors_allowed_origins', type: 'json', default: '[]', description: 'CORS allowed origins' },
  { key: 'cors_allowed_methods', type: 'json', default: '["GET","POST","PUT","DELETE"]', description: 'CORS allowed methods' },
  // audit / events
  { key: 'audit_logging_enabled', type: 'boolean', default: 'true', description: 'Enable audit logging' },
  { key: 'audit_log_retention_days', type: 'int', default: '90', description: 'Audit log retention period' },
  { key: 'sensitive_data_masking', type: 'boolean', default: 'true', description: 'Mask sensitive data in logs' },
  { key: 'event_logging_enabled', type: 'boolean', default: 'true', description: 'Enable event logging' },
  { key: 'event_listeners', type: 'json', default: '["console"]', description: 'Configured event listeners' },
  // webhooks
  { key: 'webhook_url_login', type: 'string', default: null, description: 'Login webhook URL' },
  { key: 'webhook_url_logout', type: 'string', default: null, description: 'Logout webhook URL' },
  { key: 'webhook_url_registration', type: 'string', default: null, description: 'Registration webhook URL' },
  { key: 'webhook_secret', type: 'string', default: null, encrypted: true, description: 'Webhook signing secret' },
  // platform toggles
  { key: 'enable_federation', type: 'boolean', default: 'false', description: 'Enable user federation' },
  { key: 'enable_impersonation', type: 'boolean', default: 'false', description: 'Allow admin impersonation' },
  { key: 'enable_api_console', type: 'boolean', default: 'true', description: 'Enable API console' },
  { key: 'enable_developer_mode', type: 'boolean', default: 'false', description: 'Enable development features' },
  { key: 'client_registration_allowed', type: 'boolean', default: 'true', description: 'Allow client registration' },
  { key: 'client_registration_requires_approval', type: 'boolean', default: 'true', description: 'Require approval for new clients' },
  // caching / maintenance
  { key: 'cache_enabled', type: 'boolean', default: 'true', description: 'Enable caching' },
  { key: 'cache_ttl_seconds', type: 'int', default: '300', description: 'Cache TTL (seconds)' },
  { key: 'cleanup_interval_hours', type: 'int', default: '24', description: 'Cleanup job interval (hours)' },
];

export class SettingDefinitionsSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const settingRepo = dataSource.getRepository(SettingDefinition);

    let added = 0;
    for (const s of SETTING_DEFINITIONS) {
      const exists = await settingRepo.findOne({ where: { settingKey: s.key } });
      if (!exists) {
        await settingRepo.save(
          settingRepo.create({
            settingKey: s.key,
            valueType: s.type,
            defaultValue: s.default ?? null,
            isEncrypted: s.encrypted ?? false,
            description: s.description ?? null,
          }),
        );
        added++;
      }
    }

    console.log(
      `Setting definitions seeded: +${added} (${SETTING_DEFINITIONS.length} total)`,
    );
  }
}
