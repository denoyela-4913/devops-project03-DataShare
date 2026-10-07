#!/usr/bin/env pwsh
# Ouvre / ferme / affiche l'acces a DataShare depuis le reseau local (ex. un mobile
# sur le meme Wi-Fi). A lancer SOUS WINDOWS (pas dans WSL).
#
#   .\scripts\lan-setup.ps1 enable    ouvre les ports (pare-feu Windows + pare-feu Hyper-V)
#   .\scripts\lan-setup.ps1 disable   supprime les regles creees
#   .\scripts\lan-setup.ps1 status    etat actuel (aucun droit admin requis)
#
# enable / disable demandent les droits administrateur : le script se relance
# tout seul en admin (fenetre UAC separee), attend sa fin, puis affiche l'etat ici.
# Depuis WSL : ./scripts/lan-setup enable|disable|status (lanceur bash).
#
# Ports : 4200 (ng serve) et 8082 (frontend nginx en conteneur). Le backend (:8080)
# n'est pas ouvert : l'API passe par le proxy du frontend.
#
# Pre-requis WSL2 : networkingMode=mirrored dans %USERPROFILE%\.wslconfig. En mode
# mirrored, le trafic entrant vers WSL traverse DEUX pare-feux (Windows + Hyper-V).
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('enable', 'disable', 'status')]
  [string]$Action = 'status',
  [int[]]$Ports = @(4200, 8082),
  [switch]$Pause
)

$ErrorActionPreference = 'Stop'
$WslVmCreatorId = '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}'

# Noms deja utilises historiquement : les reutiliser rend le script idempotent.
function Get-WinRuleName([int]$port) {
  switch ($port) {
    4200 { 'DataShare dev 4200' }
    8082 { 'DataShare prod 8082' }
    default { "DataShare LAN $port" }
  }
}
function Get-HvRuleName([int]$port) { "DataShare$port" }

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  ([Security.Principal.WindowsPrincipal]$id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Show-Status {
  Write-Host 'DataShare - acces reseau local'
  $nic = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway } | Select-Object -First 1
  if ($nic) {
    $cat = (Get-NetConnectionProfile -InterfaceAlias $nic.InterfaceAlias).NetworkCategory
    Write-Host ("  Interface  : {0}  IP {1}  profil {2}" -f $nic.InterfaceAlias, $nic.IPv4Address.IPAddress, $cat)
    if ($cat -ne 'Private') {
      Write-Host '  ! Le reseau n''est pas classe "Prive" : les regles ne s''appliquent pas.'
    }
  }
  $wslCfg = Join-Path $env:USERPROFILE '.wslconfig'
  $mirrored = (Test-Path $wslCfg) -and (Select-String -Path $wslCfg -Pattern '^\s*networkingMode\s*=\s*mirrored' -Quiet)
  Write-Host ("  WSL mirrored : {0}" -f $(if ($mirrored) { 'oui' } else { 'NON (ajouter networkingMode=mirrored dans .wslconfig)' }))
  $vm = Get-NetFirewallHyperVVMSetting -PolicyStore ActiveStore -Name $WslVmCreatorId -ErrorAction SilentlyContinue
  if ($vm) { Write-Host ("  Hyper-V DefaultInboundAction : {0}" -f $vm.DefaultInboundAction) }
  foreach ($p in $Ports) {
    $win = Get-NetFirewallRule -DisplayName (Get-WinRuleName $p) -ErrorAction SilentlyContinue
    $hv = Get-NetFirewallHyperVRule -Name (Get-HvRuleName $p) -ErrorAction SilentlyContinue
    Write-Host ("  Port {0,-5} : pare-feu Windows {1,-8} | pare-feu Hyper-V {2}" -f $p,
      $(if ($win) { if ($win.Enabled -eq 'True') { 'OK' } else { 'desactive' } } else { 'absent' }),
      $(if ($hv) { if ($hv.Enabled -eq 'True') { 'OK' } else { 'desactive' } } else { 'absent' }))
  }
  if ($nic) { Write-Host ("  URL mobile : http://{0}:{1}" -f $nic.IPv4Address.IPAddress, $Ports[0]) }
  Write-Host '  (Test-NetConnection vers sa propre IP LAN echoue en mode mirrored : tester depuis le mobile.)'
}

function Enable-Lan {
  foreach ($p in $Ports) {
    $name = Get-WinRuleName $p
    if (-not (Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue)) {
      New-NetFirewallRule -DisplayName $name -Direction Inbound -Protocol TCP -LocalPort $p `
        -Action Allow -Profile Private | Out-Null
    }
    Enable-NetFirewallRule -DisplayName $name
    $hv = Get-HvRuleName $p
    if (-not (Get-NetFirewallHyperVRule -Name $hv -ErrorAction SilentlyContinue)) {
      New-NetFirewallHyperVRule -Name $hv -DisplayName $name -Direction Inbound `
        -VMCreatorId $WslVmCreatorId -Protocol TCP -LocalPorts $p | Out-Null
    }
    Enable-NetFirewallHyperVRule -Name $hv
    Write-Host "port $p ouvert"
  }
}

function Disable-Lan {
  foreach ($p in $Ports) {
    Remove-NetFirewallRule -DisplayName (Get-WinRuleName $p) -ErrorAction SilentlyContinue
    Remove-NetFirewallHyperVRule -Name (Get-HvRuleName $p) -ErrorAction SilentlyContinue
    Write-Host "port $p ferme"
  }
}

# Un processus ne peut pas s'elever lui-meme : on en relance un autre en administrateur (UAC),
# dans une fenetre separee. On l'attend (-Wait) pour garder le code de retour et afficher
# le resultat dans CE terminal (lecture seule, sans droits admin).
if ($Action -ne 'status' -and -not (Test-Admin)) {
  Write-Host 'Droits administrateur requis : une fenetre de confirmation Windows (UAC) va s''ouvrir.'
  Write-Host '(Elle peut apparaitre derriere d''autres fenetres : cliquer sur la barre des taches.)'
  $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" $Action -Ports $($Ports -join ',') -Pause"
  try {
    $child = Start-Process powershell -Verb RunAs -ArgumentList $argList -Wait -PassThru
  }
  catch {
    Write-Host 'Elevation refusee ou annulee : rien n''a ete modifie.'
    exit 1
  }
  Show-Status
  if ($child.ExitCode -ne 0) { Write-Host "La fenetre elevee a signale une erreur (code $($child.ExitCode))." }
  exit $child.ExitCode
}

try {
  switch ($Action) {
    'enable' { Enable-Lan; Show-Status }
    'disable' { Disable-Lan; Show-Status }
    'status' { Show-Status }
  }
}
catch {
  Write-Host "Erreur : $($_.Exception.Message)"
  $failed = $true
}
finally {
  if ($Pause) { Read-Host 'Entree pour fermer' | Out-Null }
}
if ($failed) { exit 1 }
