@echo off
powershell -Command "$content = Get-Content 'd:\Dinamalar\screens\HomeScreen.js' -Raw; $content = $content -replace '\u00E2\u0080\u0094\u00E2\u0080\u0094\u00E2\u0080\u0094', '──'; $content | Set-Content 'd:\Dinamalar\screens\HomeScreen.js' -Encoding UTF8"
echo Fixed Unicode characters
