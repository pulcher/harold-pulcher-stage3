# Run the promptfoo eval and archive the results with a timestamp so
# every logged iteration has committed evidence.
#
# Usage: .\scripts\eval.ps1

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot)

npx promptfoo eval --no-cache
if ($LASTEXITCODE -gt 1) { exit $LASTEXITCODE }  # 1 = test failures (still archive), >1 = real error

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
New-Item -ItemType Directory -Force results | Out-Null
Copy-Item results.html "results/results-$stamp.html"
Write-Host "Archived results to results/results-$stamp.html"
Write-Host 'Reminder: update ITERATION_LOG.md — the pre-commit hook enforces it.'
