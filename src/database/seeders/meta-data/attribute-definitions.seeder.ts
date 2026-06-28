import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { AttributeDefinition } from '../../../modules/users/entities/attribute-definition.entity';

type AttributeSeed = {
  key: string;
  type: string;
  required?: boolean;
  encrypted?: boolean;
  description?: string;
};

// ---- Allowed USER_ATTRIBUTES keys -----------------------------------------
const ATTRIBUTE_DEFINITIONS: AttributeSeed[] = [
  // employment / org
  { key: 'employee_id', type: 'string', description: 'Employee identifier' },
  { key: 'department', type: 'string', description: 'Department name' },
  { key: 'job_title', type: 'string', description: 'Job position' },
  { key: 'manager_email', type: 'string', description: "Manager's email" },
  { key: 'hire_date', type: 'date', description: 'Date of hire' },
  { key: 'cost_center', type: 'string', description: 'Cost center code' },
  { key: 'project_codes', type: 'json', description: 'Assigned projects' },
  { key: 'team_lead', type: 'boolean', description: 'Is team lead' },
  { key: 'contractor', type: 'boolean', description: 'Is contractor' },
  { key: 'clearance_level', type: 'string', description: 'Security clearance' },
  { key: 'skill_set', type: 'json', description: 'Skills / technologies' },
  { key: 'certifications', type: 'json', description: 'Professional certifications' },
  { key: 'education', type: 'json', description: 'Educational background' },
  // personal
  { key: 'date_of_birth', type: 'date', description: 'Date of birth' },
  { key: 'gender', type: 'string', description: 'Gender identity' },
  { key: 'nationality', type: 'string', description: 'Nationality' },
  { key: 'marital_status', type: 'string', description: 'Marital status' },
  { key: 'office_location', type: 'string', description: 'Office location' },
  { key: 'office_building', type: 'string', description: 'Specific office location' },
  { key: 'work_phone', type: 'string', description: 'Work phone number' },
  { key: 'mobile_phone', type: 'string', description: 'Mobile phone number' },
  { key: 'emergency_contact', type: 'string', description: 'Emergency contact' },
  // locale
  { key: 'timezone', type: 'string', description: 'User timezone' },
  { key: 'preferred_language', type: 'string', description: 'Language preference' },
  { key: 'country_code', type: 'string', description: 'Country code' },
  // customer / billing (SaaS)
  { key: 'customer_id', type: 'string', description: 'Customer identifier' },
  { key: 'subscription_plan', type: 'string', description: 'Service plan' },
  { key: 'subscription_status', type: 'string', description: 'Subscription status' },
  { key: 'plan_start_date', type: 'date', description: 'Subscription start' },
  { key: 'plan_expiry_date', type: 'date', description: 'Subscription end' },
  { key: 'billing_address', type: 'text', description: 'Billing address' },
  { key: 'tax_id', type: 'string', description: 'Tax identifier' },
  { key: 'vat_number', type: 'string', description: 'VAT registration number' },
  { key: 'account_manager', type: 'string', description: 'Account manager' },
  { key: 'support_level', type: 'string', description: 'Support tier' },
  { key: 'custom_domain', type: 'string', description: 'Custom subdomain' },
  { key: 'api_key', type: 'string', encrypted: true, description: 'API key (encrypted)' },
  { key: 'webhook_url', type: 'string', description: 'Webhook endpoint' },
  { key: 'webhook_secret', type: 'string', encrypted: true, description: 'Webhook secret' },
  // marketing / consent
  { key: 'newsletter_opt_in', type: 'boolean', description: 'Newsletter subscription' },
  { key: 'marketing_consent', type: 'boolean', description: 'Marketing consent' },
  { key: 'consent_date', type: 'timestamp', description: 'Consent timestamp' },
  { key: 'preferred_communication', type: 'string', description: 'Communication preference' },
  { key: 'referral_source', type: 'string', description: 'How user found us' },
  { key: 'campaign_source', type: 'string', description: 'Marketing campaign' },
  { key: 'utm_parameters', type: 'json', description: 'UTM tracking data' },
  { key: 'last_purchase_date', type: 'date', description: 'Last purchase date' },
  { key: 'loyalty_points', type: 'int', description: 'Loyalty program points' },
  { key: 'favorite_categories', type: 'json', description: 'Product preferences' },
  // authority / limits
  { key: 'approval_level', type: 'string', description: 'Approval authority' },
  { key: 'budget_limit', type: 'decimal', description: 'Spending limit' },
  { key: 'purchase_authority', type: 'string', description: 'Purchase authority' },
  { key: 'reporting_access', type: 'json', description: 'Report access permissions' },
  // preferences / misc
  { key: 'dashboard_preferences', type: 'json', description: 'UI preferences' },
  { key: 'notification_preferences', type: 'json', description: 'Notification settings' },
  { key: 'tags', type: 'json', description: 'User tags' },
  { key: 'notes', type: 'text', description: 'Internal notes' },
  { key: 'internal_notes', type: 'text', description: 'Internal staff notes' },
  { key: 'custom_data', type: 'json', description: 'Flexible custom data' },
  // NOTE: credential/security data (totp_secret, backup_codes, mfa_*, trusted_devices,
  // allowed_ips, security_questions, force_password_change, last_password_change,
  // device_fingerprint) is intentionally NOT seeded here — those belong in dedicated
  // credential/MFA tables, not in the free-form attribute store.
];

export class AttributeDefinitionsSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const attributeRepo = dataSource.getRepository(AttributeDefinition);

    let added = 0;
    for (const a of ATTRIBUTE_DEFINITIONS) {
      const exists = await attributeRepo.findOne({
        where: { attributeKey: a.key },
      });
      if (!exists) {
        await attributeRepo.save(
          attributeRepo.create({
            attributeKey: a.key,
            valueType: a.type,
            isRequired: a.required ?? false,
            isEncrypted: a.encrypted ?? false,
            description: a.description ?? null,
          }),
        );
        added++;
      }
    }

    console.log(
      `Attribute definitions seeded: +${added} (${ATTRIBUTE_DEFINITIONS.length} total)`,
    );
  }
}
