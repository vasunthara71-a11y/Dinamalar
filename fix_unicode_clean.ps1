# Fix corrupted Unicode characters in HomeScreen.js
$file = 'd:\Dinamalar\screens\HomeScreen.js'
$content = Get-Content $file -Raw

# Replace corrupted characters with proper ones using ASCII representation
$content = $content -replace [char]226 + [char]128 + [char]148 + [char]226 + [char]128 + [char]148 + [char]226 + [char]128 + [char]148, '──'
$content = $content -replace [char]226 + [char]128 + [char]148, '—'

# Save the file with UTF-8 encoding
$content | Out-File $file -Encoding UTF8

Write-Host "Fixed Unicode characters in $file"
