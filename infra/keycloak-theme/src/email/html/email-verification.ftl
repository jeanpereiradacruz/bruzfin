<#import "template.ftl" as layout>
<@layout.emailLayout>
<h1 style="margin:0 0 12px 0;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:20px;line-height:28px;">${msg("bruzfinEmailVerificationTitle")}</h1>
<p style="margin:0;">${msg("bruzfinEmailVerificationIntro")}</p>
<@layout.button href=link label=msg("bruzfinEmailVerificationButton") />
<p style="margin:0 0 12px 0;">${msg("bruzfinEmailLinkExpires", linkExpirationFormatter(linkExpiration))}</p>
<p style="margin:0;color:#55625c;">${msg("bruzfinEmailVerificationIgnore")}</p>
</@layout.emailLayout>
