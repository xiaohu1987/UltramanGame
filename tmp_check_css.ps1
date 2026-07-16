Write-Output '8000:'
try {
  $r = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8000/css/fullbody-fix.css'
  Write-Output $r.StatusCode
  Write-Output $r.Content.Substring(0, [Math]::Min(220, $r.Content.Length))
} catch {
  Write-Output $_.Exception.Message
}

Write-Output '8792:'
try {
  $r2 = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8792/css/fullbody-fix.css'
  Write-Output $r2.StatusCode
  Write-Output $r2.Content.Substring(0, [Math]::Min(220, $r2.Content.Length))
} catch {
  Write-Output $_.Exception.Message
}
