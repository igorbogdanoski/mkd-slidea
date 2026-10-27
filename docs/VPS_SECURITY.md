# VPS (Hostinger, srv1303382) — безбедност

Базата на Slidea е самохостиран Supabase на заеднички VPS (`/root/supabase-mkd-slidea/docker/`). На истиот
сервер се и nginx (`app.mismath.net`, `supabase.mismath.net`) и базите на `olympiad-math-archive`.
Подетален запис има на самиот сервер: `/root/SECURITY-VPS.md`.

## Правила

- Однадвор отворени се само **22 (SSH), 80 и 443**. Заштитниот ѕид `ufw` е вклучен од 27.10.2026
  (default deny incoming; allow 22, 80, 443; IPv4 и IPv6).
- Нова јавна услуга: прво `ufw allow <порта>/tcp comment <што>`, па објава. Docker-портите секогаш со
  `127.0.0.1:` — запис `"5432:5432"` Docker го врзува на 0.0.0.0 и го заобиколува ufw.
- Supabase: Kong и pooler се на `127.0.0.1` (8010/8443, 5433/6544); надвор излегува само преку nginx.
- Пристап до база од свој компјутер — SSH-тунел: `ssh -L 5433:127.0.0.1:5433 root@<сервер>`;
  SQL директно: `docker exec -i supabase-db psql -U postgres -d postgres`.
- Тајни не се пишуваат во ова репо (јавно е). `.env.local` и `.secrets.local*` се во `.gitignore`.

## Инцидент 27.10.2026 (olympiad-math-archive, не Slidea)

Redis (6379) без лозинка и Postgres (5432) на архивата беа отворени кон интернет, а `ufw` исклучен; во Redis
имаше туѓи клучеви. Supabase на Slidea НЕ беше изложен (портите му се на 127.0.0.1). Поправено: портите на
`127.0.0.1`, Redis со лозинка, `ufw` вклучен. Измерено по поправката: однадвор отворени само 22, 80, 443;
Supabase 0 нездрави контејнери; `app.mismath.net` 200; контејнерите имаат излез кон интернет и со ufw.
Копии и постапка за враќање: `/root/backups/security-2026-10-27/` на серверот.

## Проверка (кога и да е)

```bash
# однадвор: само 22, 80, 443 смеат да одговорат
for p in 22 80 443 5432 6379 8000 8443; do timeout 3 bash -c "exec 3<>/dev/tcp/<сервер>/$p" 2>/dev/null && echo "$p отворена"; done
# на серверот
ufw status; ss -ltn | grep -v '127.0.0.1\|\[::1\]'
```
