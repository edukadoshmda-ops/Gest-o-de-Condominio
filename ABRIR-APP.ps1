Set-Location $PSScriptRoot
Write-Host "`nGestor360 - Iniciando...`n" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao instalar." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "`nAbrindo navegador em 6 segundos...`n" -ForegroundColor Yellow
Start-Job -ScriptBlock { Start-Sleep 6; Start-Process "http://localhost:5173" } | Out-Null
npm run dev
