<#import "template.ftl" as layout>
<@layout.emailLayout>
<h1 style="margin:0 0 12px 0;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:20px;line-height:28px;">${msg("bruzfinPasswordResetTitle")}</h1>
<p style="margin:0;">${msg("bruzfinPasswordResetIntro")}</p>
<@layout.button href=link label=msg("bruzfinPasswordResetButton") />
<p style="margin:0 0 12px 0;">${msg("bruzfinEmailLinkExpiresOnce", linkExpirationFormatter(linkExpiration))}</p>
<p style="margin:0;color:#55625c;">${msg("bruzfinPasswordResetIgnore")}</p>
</@layout.emailLayout>
