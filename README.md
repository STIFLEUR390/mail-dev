# Mail-Dev

<img src="https://raw.githubusercontent.com/STIFLEUR390/mail-dev/main/src-tauri/icons/Square107x107Logo.png" alt="Mail-Dev" align="left"/>

### Local SMTP Server For Email Testing/Debugging

Built on top of [React](https://reactjs.org/), [Vite](https://vite.dev/) and [Tauri](https://v2.tauri.app/).

---

Give it a try, [Download now](https://github.com/STIFLEUR390/mail-dev/releases).

<a href="https://www.producthunt.com/posts/mail-dev?utm_source=badge-review&utm_medium=badge&utm_souce=badge-mail-dev#discussion-body" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/review.svg?post_id=304871&theme=dark" alt="Mail-Dev - Local SMTP Server For Email Testing/Debugging | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

## Todo:
- [x] Custom SMTP server port
- [x] Frameworks configuration snippets
- [x] Attachment support
- [x] Forward emails
- [x] Notification
- [ ] Auto update
- [ ] Persistent configuration
- [ ] SMTP Authentication

<img src="https://raw.githubusercontent.com/STIFLEUR390/mail-dev/main/screenshots/spam-score.png" alt="Mail-Dev SPAM SCORE"/>
<br/>
<img src="https://raw.githubusercontent.com/STIFLEUR390/mail-dev/main/screenshots/html-mail.png" alt="Mail-Dev HTML Mail"/>
<br/>
<img src="https://raw.githubusercontent.com/STIFLEUR390/mail-dev/main/screenshots/setting.png" alt="Mail-Dev SETTING"/>

## Requirement:
- Tauri CLI v2
- NodeJS 18+ (npm/yarn) or [Bun](https://bun.sh)

### Dev
```text
bun install
bun run tauri dev
```

### Build
```text
bun install
bun run tauri build
```

> ℹ️ The frontend is bundled with Vite: Tailwind CSS is compiled automatically via PostCSS during dev/build, no separate watch step needed.
