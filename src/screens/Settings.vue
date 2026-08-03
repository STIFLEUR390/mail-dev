<template>
  <div class="h-full w-full text-lg text-gray-700 py-4 px-6 scroll overflow-y-auto">
    <h3 class="mb-2">Settings</h3>

    <!-- SMTP configuration -->
    <div class="bg-white rounded-md px-4 py-2 border mb-2">
      <h3 class="font-semibold mb-2">SMTP configuration</h3>
      <div :class="`relative flex pb-2 ${setting.srvStatus === true ? 'opacity-60' : ''}`">
        <div v-if="setting.srvStatus === true" class="absolute w-full h-full bg-white/10 z-40"></div>
        <div class="mr-3 w-64">
          <label for="ipAddress" class="block text-sm font-medium text-gray-700">IP Address</label>
          <div class="mt-1">
            <input v-model="ipAddress" type="text" name="ipAddress" id="ipAddress"
                   class="shadow-sm focus:ring-gray-500/40 focus:ring-2 focus:border-gray-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
          </div>
        </div>
        <div class="mr-3 w-32">
          <label for="port" class="block text-sm font-medium text-gray-700">Port</label>
          <div class="mt-1">
            <input v-model.number="port" type="text" name="port" id="port"
                   class="shadow-sm focus:ring-gray-500/40 focus:ring-2 focus:border-gray-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
          </div>
        </div>
        <div>
          <label for="port" class="block text-sm font-medium text-gray-700"> &nbsp; </label>
          <div class="mt-1">
            <button @click="startServer" type="button"
                    :class="`inline-flex items-center px-3 py-2.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 bg-green-500 hover:bg-green-600 ${setting.srvStatus === true && 'opacity-80'}`">
              Start Server
            </button>
          </div>
        </div>
      </div>
      <div class="text-sm font-semibold">{{ setting.srvResponseMessage }}</div>
    </div>

    <!-- Forward emails -->
    <div class="bg-white rounded-md px-4 py-2 border mb-2">
      <h3 class="font-semibold mb-2">Forward emails</h3>
      <div class="relative flex pb-2">
        <div class="mr-3 w-48 xl:w-64">
          <label for="forwardEmailHost" class="block text-sm font-medium text-gray-700">Host</label>
          <div class="mt-1">
            <input v-model="forwardEmailHost" type="text" autoComplete="none" autoCorrect="none" name="forwardEmailHost" id="forwardEmailHost"
                   class="shadow-sm focus:ring-gray-500/40 focus:ring-2 focus:border-gray-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
          </div>
        </div>

        <div class="mr-3 w-20 xl:w-28">
          <label for="forwardEmailPort" class="block text-sm font-medium text-gray-700">Port</label>
          <div class="mt-1">
            <input v-model="forwardEmailPort" type="text" autoComplete="none" autoCorrect="none" name="forwardEmailPort" id="forwardEmailPort"
                   class="shadow-sm focus:ring-gray-500/40 focus:ring-2 focus:border-gray-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
          </div>
        </div>

        <div class="mr-3 w-40 xl:w-56">
          <label for="forwardEmailUsername" class="block text-sm font-medium text-gray-700">Username</label>
          <div class="mt-1">
            <input v-model="forwardEmailUsername" type="text" autoComplete="none" autoCorrect="none" name="forwardEmailUsername" id="forwardEmailUsername"
                   class="shadow-sm focus:ring-gray-500/40 focus:ring-2 focus:border-gray-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
          </div>
        </div>

        <div class="mr-3 w-36 xl:w-56">
          <label for="forwardEmailPassword" class="block text-sm font-medium text-gray-700">Password</label>
          <div class="mt-1">
            <input v-model="forwardEmailPassword" type="password" @focus="e => e.target.type = 'text'" @blur="e => e.target.type = 'password'"
                   autoComplete="none" autoCorrect="none" name="forwardEmailPassword" id="forwardEmailPassword"
                   class="shadow-sm focus:ring-gray-500/40 focus:ring-2 focus:border-gray-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
          </div>
        </div>

        <div>
          <label for="save" class="block text-sm font-medium text-gray-700"> &nbsp; </label>
          <div class="mt-1">
            <button @click="setting.setForwardEnabled(!setting.forwardEnabled)" type="button"
                    :class="`inline-flex items-center px-3 py-2.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${setting.forwardEnabled === true ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`">
              {{ setting.forwardEnabled === true ? 'Disable Forwarding' : 'Enable Forwarding' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Show Notifications -->
    <div class="bg-white rounded-md px-4 py-2 border mb-2">
      <h3 class="font-semibold mb-2">Show Notifications</h3>
      <div class="relative flex pb-2">
        <div>
          <label for="save" class="block text-sm font-medium text-gray-700"> Show notifications when an email is received </label>
          <div class="mt-1">
            <button @click="setting.setUseNotification(!setting.useNotification)" type="button"
                    :class="`inline-flex items-center px-3 py-2.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${setting.useNotification === true ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`">
              {{ setting.useNotification === true ? 'Disable Notifications' : 'Enable Notifications' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Framework configuration -->
    <div class="bg-white rounded-md px-4 py-2 border mb-4">
      <div>
        <h3 class="font-semibold mb-2">Framework configuration</h3>
        <select v-model="framework"
                class="mt-1 block w-full xl:w-96 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500/40 focus:border-gray-500 sm:text-sm rounded-md">
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

      <p class="py-2 text-sm text-gray-600 border-b-2 border-dashed">
        If you are using Vagrant/Homestead, use <span class="font-semibold font-mono">"10.0.2.2"</span> as your SMTP-Host.<br/>
        For Docker, use <span class="font-semibold font-mono">"host.docker.internal"</span> as your SMTP-Host.
      </p>

      <div v-if="framework === 'Laravel 13'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Use these configuration values in your Laravel 13 application .env file (also valid for 11/12):
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `MAIL_MAILER=smtp
MAIL_HOST=${ipAddress}
MAIL_PORT=${port}
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null` }}
        </code>
      </div>

      <div v-else-if="framework === 'Symfony 8'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Symfony 8 uses the Mailer component. Set the DSN in your .env file:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `MAILER_DSN=smtp://${ipAddress}:${port}` }}
        </code>
      </div>

      <div v-else-if="framework === 'WordPress'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          You can configure your WordPress site to send mails to Mail-Dev by adding this to your theme's functions.php:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `function mail_dev($phpmailer) {
	$phpmailer->isSMTP();
	$phpmailer->Host = '${ipAddress}';
	$phpmailer->SMTPAuth = false;
	$phpmailer->Port = ${port};
}

add_action('phpmailer_init', 'mail_dev');` }}
        </code>
      </div>

      <div v-else-if="framework === 'Yii 3'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Yii 3 uses yiisoft/mailer with the Symfony Mailer adapter. Configure the transport DSN in config/params.php:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
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

      <div v-else-if="framework === 'PHPMailer 7'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Standalone PHP library v7 (composer require phpmailer/phpmailer):
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
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

      <div v-else-if="framework === 'CodeIgniter 4'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Add these values to your .env file:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `email.protocol = smtp
email.SMTPHost = ${ipAddress}
email.SMTPPort = ${port}
email.SMTPAuth = false` }}
        </code>
      </div>

      <div v-else-if="framework === 'Nodemailer 9'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Nodemailer 9 is an easy to use module to send e-mails with Node.JS:<br/>
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
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

      <div v-else-if="framework === 'Django 6'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Add these settings to your Django 6 settings.py:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = '${ipAddress}'
EMAIL_PORT = ${port}
EMAIL_USE_TLS = False` }}
        </code>
      </div>

      <div v-else-if="framework === 'Flask-Mail'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Add these settings to your Flask app config (pip install Flask-Mail):
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `app.config['MAIL_SERVER'] = '${ipAddress}'
app.config['MAIL_PORT'] = ${port}
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = False` }}
        </code>
      </div>

      <div v-else-if="framework === 'Ruby on Rails 8'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          In config/environments/*.rb specify ActionMailer defaults for your development or staging servers (Rails 8):
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `config.action_mailer.delivery_method = :smtp 
config.action_mailer.smtp_settings = {
	:address => '${ipAddress}',
	:domain => '${ipAddress}',
	:port => '${port}',
}` }}
        </code>
      </div>

      <div v-else-if="framework === 'Ruby (net/smtp)'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Sending email using net/smtp from Ruby stdlib:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
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

      <div v-else-if="framework === 'Spring Boot 4'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Add these properties to your Spring Boot 4 application.properties:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `spring.mail.host=${ipAddress}
spring.mail.port=${port}
spring.mail.username=
spring.mail.password=
spring.mail.properties.mail.smtp.auth=false
spring.mail.properties.mail.smtp.starttls.enable=false` }}
        </code>
      </div>

      <div v-else-if="framework === '.NET 10 (ASP.NET Core)'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Add this to appsettings.json, then use SmtpClient (System.Net.Mail, .NET 10):
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `"Smtp": {
  "Host": "${ipAddress}",
  "Port": ${port}
}` }}
        </code>
        <p class="py-2 text-sm text-gray-600">
          C# example:
        </p>
        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `using var client = new SmtpClient("${ipAddress}", ${port});
await client.SendMailAsync("from@example.com",
    "to@example.com", "Test", "Hello from Mail-Dev!");` }}
        </code>
      </div>

      <div v-else-if="framework === 'Go (net/smtp)'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Send mail using the standard library:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
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

    </div>
  </div>
</template>

<script setup>
import {storeToRefs} from 'pinia';
import {invoke} from '@tauri-apps/api/core';
import {isPermissionGranted, requestPermission, sendNotification} from '@tauri-apps/plugin-notification';
import {useSettingStore} from '../stores/setting';

const setting = useSettingStore();
const {
  ipAddress,
  port,
  framework,
  forwardEmailHost,
  forwardEmailPort,
  forwardEmailUsername,
  forwardEmailPassword,
} = storeToRefs(setting);

function notify() {
  sendNotification({
    title: "Mail-Dev: SMTP Connection",
    body: "SMTP server started successfully",
  });
}

function startServer() {
  setting.setSrvStatus(true);
  setting.setSrvResponseMessage("");
  invoke("start_smtp_server", {address: `${setting.ipAddress}:${setting.port}`}).then(response => {
    if (response.length > 0) {
      setting.setSrvStatus(false);
      setting.setSrvResponseMessage(response);
    }
  }).catch();
  setTimeout(() => {
    if (setting.srvStatus === true && setting.useNotification === true) {
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
  }, 1000);
}
</script>

