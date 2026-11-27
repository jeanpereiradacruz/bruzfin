<#-- Moldura dos emails BruzFin. Clientes de email não entendem variáveis CSS: as cores são as do tema claro de @bruzfin/design-tokens (conferidas em src/email/email.test.ts). -->
<#macro emailLayout>
<!doctype html>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>BruzFin</title>
</head>
<body style="margin:0;padding:0;background:#f7f8f6;color:#14201b;font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f8f6;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
<tr><td style="padding:0 0 24px 0;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:24px;line-height:30px;font-weight:700;color:#0f7a5a;">BruzFin</td></tr>
<tr><td style="background:#ffffff;border:1px solid #dfe4e0;border-radius:16px;padding:24px;">
<#nested>
</td></tr>
<tr><td style="padding:16px 4px 0 4px;font-size:13px;line-height:18px;color:#55625c;">${msg("bruzfinEmailFooter")}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
</#macro>

<#macro button href label>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
<tr><td style="border-radius:10px;background:#0f7a5a;">
<a href="${href}" style="display:inline-block;padding:14px 24px;font-size:16px;line-height:22px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${label}</a>
</td></tr>
</table>
</#macro>
