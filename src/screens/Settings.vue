<template>
  <div class="h-full w-full text-zinc-700 dark:text-zinc-300 py-4 px-6 scroll overflow-y-auto">
    <h2 class="text-lg font-semibold tracking-tight mb-4 text-zinc-900 dark:text-zinc-100">Settings</h2>

    <!-- SMTP configuration -->
    <section class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4 mb-2">
      <h3 class="text-[15px] font-semibold mb-3 text-zinc-900 dark:text-zinc-100">SMTP configuration</h3>
      <div :class="`relative flex pb-2 ${setting.srvStatus === true ? 'opacity-60' : ''}`">
        <div v-if="setting.srvStatus === true" class="absolute w-full h-full bg-white/50 dark:bg-zinc-950/40 z-40"></div>
        <div class="mr-3 w-64">
          <label for="ipAddress" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">IP Address</label>
          <div class="mt-1">
            <input v-model="ipAddress" type="text" name="ipAddress" id="ipAddress"
                   class="block w-full sm:text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors"/>
          </div>
        </div>
        <div class="mr-3 w-32">
          <label for="port" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Port</label>
          <div class="mt-1">
            <input v-model.number="port" type="text" name="port" id="port"
                   class="block w-full sm:text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors font-mono"/>
          </div>
        </div>
        <div>
          <div class="h-5"></div>
          <div class="mt-1 flex gap-x-2">
            <button @click="startServerClick" type="button"
                    :class="`inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-white shadow-sm transition-all active:scale-[0.98] ${
                      setting.srvStatus === true
                        ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`"
                    :disabled="setting.srvStatus === true">
              Start Server
            </button>
            <button v-if="setting.srvStatus === true" @click="stopServer" type="button"
                    class="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-white shadow-sm bg-red-600 hover:bg-red-500 transition-all active:scale-[0.98]">
              Stop Server
            </button>
          </div>
        </div>
      </div>
      <div :class="`text-sm font-medium ${setting.srvStatus === true ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`">{{ setting.srvResponseMessage }}</div>
    </section>

    <!-- SMTP Authentication -->
    <section class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4 mb-2">
      <h3 class="text-[15px] font-semibold mb-3 text-zinc-900 dark:text-zinc-100">SMTP Authentication</h3>
      <div class="relative flex flex-wrap items-start pb-2 gap-y-3">
        <div class="mr-3 w-48">
          <div class="flex items-center gap-2 pt-1">
            <SwitchToggle v-model="setting.srvAuthEnabled" label="Enable AUTH (PLAIN/LOGIN)"/>
            <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-tight">Enable AUTH (PLAIN/LOGIN)</label>
          </div>
        </div>
        <div class="mr-3 w-56">
          <label for="srvUsername" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
          <div class="mt-1">
            <input v-model="srvUsername" type="text" autoComplete="none" autoCorrect="none" name="srvUsername" id="srvUsername"
                   class="block w-full sm:text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors"/>
          </div>
        </div>
        <div class="w-56">
          <label for="srvPassword" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
          <div class="mt-1">
            <input v-model="srvPassword" type="password" @focus="e => e.target.type = 'text'" @blur="e => e.target.type = 'password'"
                   autoComplete="none" autoCorrect="none" name="srvPassword" id="srvPassword"
                   class="block w-full sm:text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors"/>
          </div>
        </div>
      </div>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">When enabled, clients must authenticate with AUTH PLAIN/LOGIN before sending mail. Credentials travel in plaintext. Only use this on localhost for testing.</p>
    </section>

    <!-- Updates -->
    <section class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4 mb-2">
      <h3 class="text-[15px] font-semibold mb-3 text-zinc-900 dark:text-zinc-100">Updates</h3>
      <div class="relative flex items-center pb-2">
        <button @click="checkForUpdates" type="button"
                class="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-white shadow-sm bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-all active:scale-[0.98]">
          Check for updates
        </button>
        <div class="ml-3 text-sm text-zinc-600 dark:text-zinc-400">{{ updateStatus }}</div>
      </div>
    </section>

    <!-- Forward emails -->
    <section class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4 mb-2">
      <h3 class="text-[15px] font-semibold mb-3 text-zinc-900 dark:text-zinc-100">Forward emails</h3>
      <div class="flex items-center gap-2 pb-3">
        <SwitchToggle v-model="setting.forwardEnabled" label="Enable Forwarding"/>
        <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Enable Forwarding</label>
      </div>
      <div class="relative flex flex-wrap pb-2 gap-y-3">
        <div class="mr-3 w-48 xl:w-64">
          <label for="forwardEmailHost" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Host</label>
          <div class="mt-1">
            <input v-model="forwardEmailHost" type="text" autoComplete="none" autoCorrect="none" name="forwardEmailHost" id="forwardEmailHost"
                   class="block w-full sm:text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors"/>
          </div>
        </div>

        <div class="mr-3 w-20 xl:w-28">
          <label for="forwardEmailPort" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Port</label>
          <div class="mt-1">
            <input v-model="forwardEmailPort" type="text" autoComplete="none" autoCorrect="none" name="forwardEmailPort" id="forwardEmailPort"
                   class="block w-full sm:text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors font-mono"/>
          </div>
        </div>

        <div class="mr-3 w-40 xl:w-56">
          <label for="forwardEmailUsername" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
          <div class="mt-1">
            <input v-model="forwardEmailUsername" type="text" autoComplete="none" autoCorrect="none" name="forwardEmailUsername" id="forwardEmailUsername"
                   class="block w-full sm:text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors"/>
          </div>
        </div>

        <div class="mr-3 w-36 xl:w-56">
          <label for="forwardEmailPassword" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
          <div class="mt-1">
            <input v-model="forwardEmailPassword" type="password" @focus="e => e.target.type = 'text'" @blur="e => e.target.type = 'password'"
                   autoComplete="none" autoCorrect="none" name="forwardEmailPassword" id="forwardEmailPassword"
                   class="block w-full sm:text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors"/>
          </div>
        </div>
      </div>
    </section>

    <!-- Spam checking -->
    <section class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4 mb-2">
      <h3 class="text-[15px] font-semibold mb-3 text-zinc-900 dark:text-zinc-100">Spam checking</h3>
      <div class="relative flex items-center gap-2 pb-2">
        <SwitchToggle v-model="setting.spamChecking" label="Check spam score with SpamAssassin (postmarkapp.com)"/>
        <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300"> Check spam score with SpamAssassin (postmarkapp.com) </label>
      </div>
    </section>

    <!-- Show Notifications -->
    <section class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4 mb-2">
      <h3 class="text-[15px] font-semibold mb-3 text-zinc-900 dark:text-zinc-100">Show Notifications</h3>
      <div class="relative flex items-center gap-2 pb-2">
        <SwitchToggle v-model="setting.useNotification" label="Show notifications when an email is received"/>
        <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300"> Show notifications when an email is received </label>
      </div>
    </section>

    <!-- Framework configuration -->
    <section class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4 mb-4">
      <div>
        <h3 class="text-[15px] font-semibold mb-3 text-zinc-900 dark:text-zinc-100">Framework configuration</h3>
        <select v-model="framework"
                class="mt-1 block w-full xl:w-96 px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors">
          <optgroup label="PHP">
            <option>Laravel 13</option>
            <option>Symfony 8</option>
            <option>WordPress</option>
            <option>Yii 3</option>
            <option>PHPMailer 7</option>
            <option>CodeIgniter 4</option>
          </optgroup>
          <optgroup label="JavaScript / Node.js">
            <option>Nodemailer 9</option>
          </optgroup>
          <optgroup label="Python">
            <option>Django 6</option>
            <option>Flask-Mail</option>
          </optgroup>
          <optgroup label="Ruby">
            <option>Ruby on Rails 8</option>
            <option>Ruby (net/smtp)</option>
          </optgroup>
          <optgroup label="Java / JVM">
            <option>Spring Boot 4</option>
          </optgroup>
          <optgroup label=".NET">
            <option>.NET 10 (ASP.NET Core)</option>
          </optgroup>
          <optgroup label="Go">
            <option>Go (net/smtp)</option>
          </optgroup>
        </select>
      </div>

      <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400 border-b border-dashed border-zinc-200 dark:border-zinc-700">
        If you are using Vagrant/Homestead, use <span class="font-semibold font-mono">"10.0.2.2"</span> as your SMTP-Host.<br/>
        For Docker, use <span class="font-semibold font-mono">"host.docker.internal"</span> as your SMTP-Host.
      </p>

      <div v-if="framework === 'Laravel 13'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Use these configuration values in your Laravel 13 application .env file (also valid for 11/12):
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `MAIL_MAILER=smtp
MAIL_HOST=${ipAddress}
MAIL_PORT=${port}
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null` }}
        </code>
      </div>

      <div v-else-if="framework === 'Symfony 8'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Symfony 8 uses the Mailer component. Set the DSN in your .env file:
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `MAILER_DSN=smtp://${ipAddress}:${port}` }}
        </code>
      </div>

      <div v-else-if="framework === 'WordPress'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          You can configure your WordPress site to send mails to Mail-Dev by adding this to your theme's functions.php:
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `function mail_dev($phpmailer) {
	$phpmailer->isSMTP();
	$phpmailer->Host = '${ipAddress}';
	$phpmailer->SMTPAuth = false;
	$phpmailer->Port = ${port};
}

add_action('phpmailer_init', 'mail_dev');` }}
        </code>
      </div>

      <div v-else-if="framework === 'Yii 3'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Yii 3 uses yiisoft/mailer with the Symfony Mailer adapter. Configure the transport DSN in config/params.php:
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `return [
	'yiisoft/mailer' => [
		'mailer' => [
			'transport' => [
				'dsn' => 'smtp://${ipAddress}:${port}',
			],
		],
	],
];` }}
        </code>
      </div>

      <div v-else-if="framework === 'PHPMailer 7'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Standalone PHP library v7 (composer require phpmailer/phpmailer):
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `<?php
require 'vendor/autoload.php';

$mail = new PHPMailer\PHPMailer\PHPMailer(true);
$mail->isSMTP();
$mail->Host = '${ipAddress}';
$mail->SMTPAuth = false;
$mail->Port = ${port};
$mail->setFrom('from@example.com');
$mail->addAddress('to@example.com');
$mail->Subject = 'Test';
$mail->Body = 'Hello from Mail-Dev!';
$mail->send();` }}
        </code>
      </div>

      <div v-else-if="framework === 'CodeIgniter 4'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add these values to your .env file:
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `email.protocol = smtp
email.SMTPHost = ${ipAddress}
email.SMTPPort = ${port}
email.SMTPAuth = false` }}
        </code>
      </div>

      <div v-else-if="framework === 'Nodemailer 9'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Nodemailer 9 is an easy to use module to send e-mails with Node.JS:<br/>
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
	host: "${ipAddress}",
	port: ${port},
});

await transport.sendMail({
	from: 'from@example.com',
	to: 'to@example.com',
	subject: 'Test',
	text: 'Hello from Mail-Dev!',
});` }}
        </code>
      </div>

      <div v-else-if="framework === 'Django 6'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add these settings to your Django 6 settings.py:
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = '${ipAddress}'
EMAIL_PORT = ${port}
EMAIL_USE_TLS = False` }}
        </code>
      </div>

      <div v-else-if="framework === 'Flask-Mail'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add these settings to your Flask app config (pip install Flask-Mail):
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `app.config['MAIL_SERVER'] = '${ipAddress}'
app.config['MAIL_PORT'] = ${port}
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = False` }}
        </code>
      </div>

      <div v-else-if="framework === 'Ruby on Rails 8'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          In config/environments/*.rb specify ActionMailer defaults for your development or staging servers (Rails 8):
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `config.action_mailer.delivery_method = :smtp 
config.action_mailer.smtp_settings = {
	:address => '${ipAddress}',
	:domain => '${ipAddress}',
	:port => '${port}',
}` }}
        </code>
      </div>

      <div v-else-if="framework === 'Ruby (net/smtp)'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sending email using net/smtp from Ruby stdlib:
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `require 'net/smtp'

message = <<-END.split("\n").map!(&:strip).join("\n")
From: Private Person <from@${ipAddress}>
To: A Test User <to@${ipAddress}>
Subject: MAIL-DEV!

This is a test e-mail message from MAIL-DEV.
END

Net::SMTP.start('${ipAddress}',
              ${port},
              '${ipAddress}') do |smtp|
smtp.send_message message, 'from@${ipAddress}',
                           'to@${ipAddress}'
end` }}
        </code>
      </div>

      <div v-else-if="framework === 'Spring Boot 4'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add these properties to your Spring Boot 4 application.properties:
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `spring.mail.host=${ipAddress}
spring.mail.port=${port}
spring.mail.username=
spring.mail.password=
spring.mail.properties.mail.smtp.auth=false
spring.mail.properties.mail.smtp.starttls.enable=false` }}
        </code>
      </div>

      <div v-else-if="framework === '.NET 10 (ASP.NET Core)'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add this to appsettings.json, then use SmtpClient (System.Net.Mail, .NET 10):
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `"Smtp": {
  "Host": "${ipAddress}",
  "Port": ${port}
}` }}
        </code>
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          C# example:
        </p>
        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `using var client = new SmtpClient("${ipAddress}", ${port});
await client.SendMailAsync("from@example.com",
    "to@example.com", "Test", "Hello from Mail-Dev!");` }}
        </code>
      </div>

      <div v-else-if="framework === 'Go (net/smtp)'" class="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        <p class="py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Send mail using the standard library:
        </p>

        <code class="font-mono text-[13px] mb-2 block bg-zinc-900 dark:bg-zinc-950 text-zinc-200 dark:text-zinc-100 rounded-lg p-3 overflow-x-auto shadow-inner">
          {{ `package main

import (
	"net/smtp"
)

func main() {
	msg := "To: to@example.com\r\n" +
		"Subject: Test\r\n" +
		"\r\n" +
		"Hello from Mail-Dev!"
	smtp.SendMail("${ipAddress}:${port}", nil,
		"from@example.com", []string{"to@example.com"}, []byte(msg))
}` }}
        </code>
      </div>

    </section>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import {storeToRefs} from 'pinia';
import {isPermissionGranted, requestPermission, sendNotification} from '@tauri-apps/plugin-notification';
import {check} from '@tauri-apps/plugin-updater';
import {relaunch} from '@tauri-apps/plugin-process';
import {useSettingStore} from '../stores/setting';
import {useSmtpServer} from '../composables/useSmtpServer';
import SwitchToggle from '../components/SwitchToggle.vue';

const setting = useSettingStore();
const {startServer, stopServer} = useSmtpServer();
const {
  ipAddress,
  port,
  framework,
  forwardEmailHost,
  forwardEmailPort,
  forwardEmailUsername,
  forwardEmailPassword,
  srvUsername,
  srvPassword,
} = storeToRefs(setting);

function notify() {
  sendNotification({
    title: "Mail-Dev: SMTP Connection",
    body: "SMTP server started successfully",
  });
}

async function startServerClick() {
  const started = await startServer();
  if (started && setting.useNotification === true) {
    isPermissionGranted().then(granted => {
      if (!granted) {
        requestPermission().then(response => {
          if (response === 'granted') {
            notify();
          }
        });
      } else {
        notify();
      }
    });
  }
}

const updateStatus = ref('');

async function checkForUpdates() {
  updateStatus.value = 'Checking for updates...';
  try {
    const update = await check();
    if (!update) {
      updateStatus.value = 'You are up to date!';
      return;
    }
    updateStatus.value = `Update ${update.version} available. Downloading...`;
    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        updateStatus.value = 'Downloading update...';
      }
      if (event.event === 'Finished') {
        updateStatus.value = 'Download finished. Restarting...';
      }
    });
    await relaunch();
  } catch (err) {
    updateStatus.value = `Update check failed: ${err}`;
    console.error(err);
  }
}
</script>
