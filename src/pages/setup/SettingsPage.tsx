// src/pages/setup/SettingsPage.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'
import GeneralSettingTab      from './tabs/GeneralSettingTab'
import PrefixSettingTab       from './tabs/PrefixSettingTab'
import AttendanceSettingTab   from './tabs/AttendanceSettingTab'
import NotificationSettingTab from './tabs/NotificationSettingTab'
import CaptchaSettingTab      from './tabs/CaptchaSettingTab'
import ModulesTab             from './tabs/ModulesTab'
import LanguagesTab           from './tabs/LanguagesTab'
import RolesPermissionsTab    from './tabs/RolesPermissionsTab'
import UsersTab               from './tabs/UsersTab'
import SystemUpdateTab        from './tabs/SystemUpdateTab'
import GatewayConfigTab       from './tabs/GatewayConfigTab'
import SimpleStubTab          from './tabs/SimpleStubTab'

type TabId =
  | 'general' | 'attendance' | 'notification' | 'system_notification'
  | 'sms' | 'email' | 'payment_methods' | 'front_cms' | 'prefix'
  | 'roles' | 'backup' | 'languages' | 'users' | 'captcha'
  | 'addons' | 'modules' | 'system_update'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'general',             label: 'General Setting' },
  { id: 'attendance',          label: 'Attendance Setting' },
  { id: 'notification',        label: 'Notification Setting' },
  { id: 'system_notification', label: 'System Notification Setting' },
  { id: 'sms',                 label: 'SMS Setting' },
  { id: 'email',               label: 'Email Setting' },
  { id: 'payment_methods',     label: 'Payment Methods' },
  { id: 'front_cms',           label: 'Front CMS Setting' },
  { id: 'prefix',              label: 'Prefix Setting' },
  { id: 'roles',               label: 'Roles Permissions' },
  { id: 'backup',              label: 'Backup / Restore' },
  { id: 'languages',           label: 'Languages' },
  { id: 'users',               label: 'Users' },
  { id: 'captcha',             label: 'Captcha Settings' },
  { id: 'addons',              label: 'Addons' },
  { id: 'modules',             label: 'Modules' },
  { id: 'system_update',       label: 'System Update' },
]


const SMS_GATEWAYS = [
  { id: 'clickatell',     name: 'Clickatell SMS Gateway',
    fields: [{ key: 'username', label: 'Clickatell Username' },
             { key: 'password', label: 'Clickatell Password', type: 'password' as const },
             { key: 'api_key', label: 'Clickatell Api Key' },
             { key: 'status', label: 'Status', type: 'select' as const, options: ['Enabled','Disabled'] }]
  },
  { id: 'twilio',         name: 'Twilio SMS Gateway',
    fields: [{ key: 'sid', label: 'Twilio SID' },
             { key: 'token', label: 'Twilio Auth Token', type: 'password' as const },
             { key: 'from', label: 'From Number' },
             { key: 'status', label: 'Status', type: 'select' as const, options: ['Enabled','Disabled'] }]
  },
  { id: 'msg91',          name: 'MSG91',
    fields: [{ key: 'auth_key', label: 'Auth Key', type: 'password' as const },
             { key: 'sender_id', label: 'Sender ID' },
             { key: 'status', label: 'Status', type: 'select' as const, options: ['Enabled','Disabled'] }]
  },
  { id: 'textlocal',      name: 'Text Local',
    fields: [{ key: 'api_key', label: 'API Key', type: 'password' as const },
             { key: 'sender', label: 'Sender' },
             { key: 'status', label: 'Status', type: 'select' as const, options: ['Enabled','Disabled'] }]
  },
  { id: 'sms_country',    name: 'SMS Country',
    fields: [{ key: 'auth_key', label: 'Auth Key', type: 'password' as const },
             { key: 'sender_id', label: 'Sender ID' },
             { key: 'status', label: 'Status', type: 'select' as const, options: ['Enabled','Disabled'] }]
  },
  { id: 'bulk_sms',       name: 'Bulk SMS',
    fields: [{ key: 'username', label: 'Username' },
             { key: 'password', label: 'Password', type: 'password' as const },
             { key: 'status', label: 'Status', type: 'select' as const, options: ['Enabled','Disabled'] }]
  },
  { id: 'mobireach',      name: 'Mobireach',
    fields: [{ key: 'api_key', label: 'API Key', type: 'password' as const },
             { key: 'sender', label: 'Sender' },
             { key: 'status', label: 'Status', type: 'select' as const, options: ['Enabled','Disabled'] }]
  },
  { id: 'nexmo',          name: 'Nexmo',
    fields: [{ key: 'api_key', label: 'API Key' },
             { key: 'api_secret', label: 'API Secret', type: 'password' as const },
             { key: 'status', label: 'Status', type: 'select' as const, options: ['Enabled','Disabled'] }]
  },
  { id: 'africastalking', name: 'AfricasTalking',
    fields: [{ key: 'username', label: 'Username' },
             { key: 'api_key', label: 'API Key', type: 'password' as const },
             { key: 'status', label: 'Status', type: 'select' as const, options: ['Enabled','Disabled'] }]
  },
  { id: 'custom',         name: 'Custom SMS Gateway',
    fields: [{ key: 'endpoint', label: 'Endpoint URL' },
             { key: 'api_key', label: 'API Key', type: 'password' as const },
             { key: 'method', label: 'HTTP Method', type: 'select' as const, options: ['GET','POST'] }]
  },
]

const PAYMENT_GATEWAYS = [
  { id: 'paypal',     name: 'Paypal',
    fields: [{ key: 'username', label: 'Paypal Username' },
             { key: 'password', label: 'Paypal Password', type: 'password' as const },
             { key: 'signature', label: 'Paypal Signature' },
             { key: 'fees_type', label: 'Processing Fees Type', type: 'select' as const, options: ['None','Percentage','Fix Amount'] },
             { key: 'fees_value', label: 'Percentage / Fix Amount' }] },
  { id: 'stripe',     name: 'Stripe',
    fields: [{ key: 'publishable_key', label: 'Publishable Key' },
             { key: 'secret_key', label: 'Secret Key', type: 'password' as const }] },
  { id: 'payu',       name: 'PayU',
    fields: [{ key: 'merchant_id', label: 'Merchant ID' },
             { key: 'salt', label: 'Salt', type: 'password' as const }] },
  { id: 'ccavenue',   name: 'CCAvenue',
    fields: [{ key: 'merchant_id', label: 'Merchant ID' },
             { key: 'access_code', label: 'Access Code' },
             { key: 'working_key', label: 'Working Key', type: 'password' as const }] },
  { id: 'instamojo',  name: 'InstaMojo',
    fields: [{ key: 'api_key', label: 'API Key' },
             { key: 'auth_token', label: 'Auth Token', type: 'password' as const }] },
  { id: 'paystack',   name: 'Paystack',
    fields: [{ key: 'public_key', label: 'Public Key' },
             { key: 'secret_key', label: 'Secret Key', type: 'password' as const }] },
  { id: 'razorpay',   name: 'Razorpay',
    fields: [{ key: 'key_id', label: 'Key ID' },
             { key: 'key_secret', label: 'Key Secret', type: 'password' as const }] },
  { id: 'paytm',      name: 'Paytm',
    fields: [{ key: 'mid', label: 'Merchant ID' },
             { key: 'merchant_key', label: 'Merchant Key', type: 'password' as const }] },
]

const EMAIL_ENGINES = [
  { id: 'main', name: 'Email Engine',
    fields: [
      { key: 'engine', label: 'Email Engine', type: 'select' as const,
        options: ['SendMail','SMTP','Mailgun','SendGrid'] },
      { key: 'smtp_host', label: 'SMTP Host' },
      { key: 'smtp_port', label: 'SMTP Port' },
      { key: 'smtp_user', label: 'SMTP User' },
      { key: 'smtp_pass', label: 'SMTP Password', type: 'password' as const },
      { key: 'from_email', label: 'From Email' },
      { key: 'from_name', label: 'From Name' },
    ]
  },
]

const FRONT_CMS_FIELDS = [
  { id: 'main', name: 'Front CMS',
    fields: [
      { key: 'front_cms_enabled', label: 'Front CMS', type: 'select' as const, options: ['Enabled','Disabled'] },
      { key: 'online_appointment', label: 'Online Appointment', type: 'select' as const, options: ['Enabled','Disabled'] },
      { key: 'rtl', label: 'Language RTL Text Mode', type: 'select' as const, options: ['Enabled','Disabled'] },
      { key: 'sidebar_news', label: 'Sidebar Option — News', type: 'select' as const, options: ['Enabled','Disabled'] },
      { key: 'sidebar_complain', label: 'Sidebar Option — Complain', type: 'select' as const, options: ['Enabled','Disabled'] },
      { key: 'footer_text', label: 'Footer Text' },
      { key: 'facebook_url', label: 'Facebook URL' },
      { key: 'twitter_url', label: 'Twitter URL' },
      { key: 'youtube_url', label: 'Youtube URL' },
      { key: 'linkedin_url', label: 'Linkedin URL' },
      { key: 'instagram_url', label: 'Instagram URL' },
    ]
  },
]


export default function SettingsPage() {
  const [active, setActive] = useState<TabId>('general')

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Setup → Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Hospital configuration, gateways and access</p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left tab list */}
        <aside className="col-span-3 card overflow-hidden">
          <nav className="text-sm">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={cn(
                  'w-full text-left px-4 py-2.5 border-b',
                  active === t.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Active tab content */}
        <section className="col-span-9 card p-5">
          {active === 'general'             && <GeneralSettingTab/>}
          {active === 'attendance'          && <AttendanceSettingTab/>}
          {active === 'notification'        && <NotificationSettingTab/>}
          {active === 'system_notification' && (
            <SimpleStubTab
              title="System Notification Setting"
              description="Configure per-event system notifications for staff and patients. Defaults are seeded in the database."/>
          )}
          {active === 'sms' && (
            <GatewayConfigTab
              title="SMS Setting"
              scopePrefix="sms"
              gateways={SMS_GATEWAYS}
              description="Configure the SMS gateway used to send outbound notifications."/>
          )}
          {active === 'email' && (
            <GatewayConfigTab
              title="Email Setting"
              scopePrefix="email"
              gateways={EMAIL_ENGINES}
              description="Configure the email engine used to send outbound mail."/>
          )}
          {active === 'payment_methods' && (
            <GatewayConfigTab
              title="Payment Methods"
              scopePrefix="payment"
              gateways={PAYMENT_GATEWAYS}
              description="Configure payment gateway credentials."/>
          )}
          {active === 'front_cms' && (
            <GatewayConfigTab
              title="Front CMS Setting"
              scopePrefix="front_cms"
              gateways={FRONT_CMS_FIELDS}/>
          )}
          {active === 'prefix'              && <PrefixSettingTab/>}
          {active === 'roles'               && <RolesPermissionsTab/>}
          {active === 'backup' && (
            <SimpleStubTab title="Backup / Restore"
              description="Database backup and restore. Wire up to a server-side dump job to enable downloads/restores."/>
          )}
          {active === 'languages'           && <LanguagesTab/>}
          {active === 'users'               && <UsersTab/>}
          {active === 'captcha'             && <CaptchaSettingTab/>}
          {active === 'addons' && (
            <SimpleStubTab title="Addons"
              description="Optional addons (Multi Branch, QR Attendance, 2FA). Already enabled in-code; this tab manages registration codes."/>
          )}
          {active === 'modules'             && <ModulesTab/>}
          {active === 'system_update'       && <SystemUpdateTab/>}
        </section>
      </div>
    </div>
  )
}
