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
                class="mt-1 block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500/40 focus:border-gray-500 sm:text-sm rounded-md">
          <option>Laravel</option>
          <option>Symfony</option>
          <option>WordPress</option>
          <option>Yii Framework</option>
          <option>Nodemailer</option>
          <option>Ruby on Rails</option>
          <option>Ruby (net/smtp)</option>
        </select>
      </div>

      <p class="py-2 text-sm text-gray-600 border-b-2 border-dashed">
        If you are using Vagrant/Homestead, use <span class="font-semibold font-mono">"10.0.2.2"</span> as your SMTP-Host.<br/>
        For Docker, use <span class="font-semibold font-mono">"host.docker.internal"</span> as your SMTP-Host.
      </p>

      <div v-if="framework === 'Laravel'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Use these configuration values in your Laravel applications .env file:
        </p>

        <h4 class="py-1 font-semibold">For Laravel 7+:</h4>
        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `MAIL_MAILER=smtp\nMAIL_HOST=${ipAddress}\nMAIL_PORT=${port}\nMAIL_USERNAME=null\nMAIL_PASSWORD=null\nMAIL_ENCRYPTION=null` }}
        </code>

        <h4 class="py-1 font-semibold">For Laravel 6 and below:</h4>
        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `MAIL_DRIVER=smtp\nMAIL_HOST=${ipAddress}\nMAIL_PORT=${port}\nMAIL_USERNAME=null\nMAIL_PASSWORD=null\nMAIL_ENCRYPTION=null` }}
        </code>
      </div>

      <div v-else-if="framework === 'Symfony'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Symfony uses SwiftMailerBundle to send emails. You can find more information on how to send email on. <br/>
          To get started you need to modify .env file in your project directory and set MAILER_URL value:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `MAILER_URL=smtp://${ipAddress}:${port}?encryption=null&auth_mode=null` }}
        </code>
      </div>

      <div v-else-if="framework === 'WordPress'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          You can configure your WordPress site to send mails to Mail-Dev by using :
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `function mail_dev($phpmailer) {\n\t$phpmailer->isSMTP();\n\t$phpmailer->Host = '${ipAddress}';\n\t$phpmailer->SMTPAuth = false;\n\t$phpmailer->Port = ${port};\n}\n\nadd_action('phpmailer_init', 'mail_dev');` }}
        </code>
      </div>

      <div v-else-if="framework === 'Yii Framework'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          You can find documentation for sending emails using SMTP in Yii Framework here. <br/>
          In your config file add:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `'components' => [\n\t'mailer' => [\n\t\t'class' => 'yii\\swiftmailer\\Mailer',\n\t\t'enableSwiftMailerLogging' => true,\n\t\t'transport' => [\n\t\t\t'class' => 'Swift_SmtpTransport',\n\t\t\t"host" => '${ipAddress}',\n\t\t\t"port" => ${port},\n\t\t],\n\t],\n],` }}
        </code>
      </div>

      <div v-else-if="framework === 'Nodemailer'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Nodemailer is an easy to use module to send e-mails with Node.JS:<br/>
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `let transport = nodemailer.createTransport({\n\thost: "${ipAddress}",\n\tport: ${port},\n});` }}
        </code>
      </div>

      <div v-else-if="framework === 'Ruby on Rails'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          In config/environments/*.rb specify ActionMailer defaults for your development or staging servers:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `config.action_mailer.delivery_method = :smtp \nconfig.action_mailer.smtp_settings = {\n\t:address => '${ipAddress}',\n\t:domain => '${ipAddress}',\n\t:port => '${port}',\n}` }}
        </code>
      </div>

      <div v-else-if="framework === 'Ruby (net/smtp)'" class="whitespace-pre-wrap text-sm text-gray-600">
        <p class="py-2 text-sm text-gray-600">
          Sending email using net/smtp from Ruby stdlib:
        </p>

        <code class="font-mono mb-2 block bg-gray-900 shadow-inner rounded-md p-2 text-gray-300">
          {{ `require 'net/smtp'\n\nmessage = <<-END.split("\n").map!(&:strip).join("\n")\nFrom: Private Person <from@${ipAddress}>\nTo: A Test User <to@${ipAddress}>\nSubject: MAIL-DEV!\n\nThis is a test e-mail message from MAIL-DEV.\nEND\n\nNet::SMTP.start('${ipAddress}',\n              ${port},\n              '${ipAddress}') do |smtp|\nsmtp.send_message message, 'from@${ipAddress}',\n                           'to@${ipAddress}'\nend` }}
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
