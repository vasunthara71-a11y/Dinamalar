# Fix corrupted Unicode characters in HomeScreen.js
$file = 'd:\Dinamalar\screens\HomeScreen.js'
$content = Get-Content $file -Raw

# Replace corrupted characters with proper ones
$content = $content -replace 'â"€â"€â"€', '──'
$content = $content -replace 'â"€', '—'
$content = $content -replace 'â"', '"'

# Save the file with UTF-8 encoding
$content | Out-File $file -Encoding UTF8

Write-Host "Fixed Unicode characters in $file"
