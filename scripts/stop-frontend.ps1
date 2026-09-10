#!/usr/bin/env pwsh
# Lanceur - delegue a datashare.ps1 (toute la logique y est).
& "$PSScriptRoot/datashare.ps1" stop-frontend @args
