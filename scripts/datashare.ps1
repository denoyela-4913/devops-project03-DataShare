#Requires -Version 5.1
<#
    Pilotage local de la stack DataShare : backend / frontend / dependances Docker.

    Toute la logique est ici ; l'action vient du 1er argument, ou du nom d'appel
    via les petits lanceurs scripts\<action>.ps1 (voir scripts\README.md) :

        .\scripts\start-backend-dev.ps1   ==  .\scripts\datashare.ps1 start-backend-dev
        scripts\status-appli.cmd          ==  powershell -File scripts\datashare.ps1 status-appli

    Actions :
        start-backend-dev    stack Docker au besoin + mvnw spring-boot:run (profil dev, :8080)
        start-backend-prod   .env.prod.local + mvnw package + java -jar (profil prod)
        start-frontend-dev   npm start (ng serve, :4200, proxy /api -> :8080)
        start-frontend-prod  npm run start:prod (build prod + budgets + proxy /api)
        stop-backend         arrete le backend lance ici (PID) puis par motif / port 8080
        stop-frontend        idem frontend (port 4200)
        status-appli         tableau OK/NOK : backend, frontend, conteneurs db/minio/adminer

    Options :
        -Bg         detache le service (PID + log dans scripts\.run\) au lieu du premier plan
        -Hard       stop brutal (Stop-Process java / node)
        -WithDeps   stop-backend arrete aussi la stack Docker (alias : -Wd)
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Action,
    [switch]$Bg,
    [switch]$Hard,
    [Alias('Wd')]
    [switch]$WithDeps
)

# 'Continue' et pas 'Stop' : le script appelle beaucoup docker / npm / mvnw / taskkill,
# et sous PowerShell 5.1 leur sortie stderr devient une NativeCommandError terminante
# avec 'Stop'. Les echecs qui comptent sont verifies explicitement ($LASTEXITCODE, Die).
$ErrorActionPreference = 'Continue'
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $PSScriptRoot
$RunDir = Join-Path $PSScriptRoot '.run'
New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

$BackendUrl = 'http://localhost:8080'
$FrontendUrl = 'http://localhost:4200'
$ComposeFile = Join-Path $RepoRoot 'deploy/docker-compose.yml'
$ComposeEnv = Join-Path $RepoRoot 'deploy/.env'
$ComposeProject = 'datashare-dev'

if (-not $Action) {
    $Action = [IO.Path]::GetFileNameWithoutExtension($MyInvocation.MyCommand.Name)
}

# --------------------------------------------------------------- affichage ---
function Say { param([string]$m) Write-Host $m }
function Ok { param([string]$m) Write-Host '  OK  ' -ForegroundColor Green -NoNewline; Write-Host $m }
function Nok { param([string]$m) Write-Host '  NOK ' -ForegroundColor Red -NoNewline; Write-Host $m }
function Die { param([string]$m) Write-Host "erreur: $m" -ForegroundColor Red; exit 1 }

# --------------------------------------------------------------- outillage ---
function Have { param([string]$c) [bool](Get-Command $c -ErrorAction SilentlyContinue) }

function Http-Up {
    param([string]$url)
    try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri $url | Out-Null; return $true }
    catch { return $false }
}

function Mvnw-Bin {
    $cmd = Join-Path $RepoRoot 'backend/mvnw.cmd'
    if (Test-Path $cmd) { return $cmd }
    if (Have 'mvn') { return 'mvn' }
    Die 'ni backend\mvnw.cmd ni mvn sur le PATH'
}

function Node-Check {
    if (-not (Have 'node')) { Die 'node introuvable (Node 24 attendu - voir frontend\.nvmrc)' }
    $want = (Get-Content (Join-Path $RepoRoot 'frontend/.nvmrc') -ErrorAction SilentlyContinue) -replace '\D', ''
    $major = (& node -p 'process.versions.node.split(".")[0]') 2>$null
    if ($want -and $major -and $major -ne $want) {
        Say "  ! Node $major detecte, $want attendu (frontend\.nvmrc)"
    }
}

function Container-State {
    param([string]$name)
    $s = & docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $name 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $s) { return 'absent' }
    return $s.Trim()
}

# ------------------------------------------------------------- dependances ---
function Deps-Up {
    if (-not (Have 'docker')) { Die 'docker introuvable' }
    if (-not (Test-Path $ComposeEnv)) {
        Copy-Item (Join-Path $RepoRoot 'deploy/.env.example') $ComposeEnv
        Say 'cree : deploy\.env (copie de .env.example)'
    }
    Say 'dependances Docker (db, minio, adminer)...'
    # docker compose ecrit sa progression sur stderr -> 2>&1 pour ne pas la voir en rouge
    & docker compose --env-file $ComposeEnv -f $ComposeFile up -d 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) { Die 'docker compose up a echoue' }

    for ($i = 0; $i -lt 30; $i++) {
        $ready = $true
        foreach ($c in 'db', 'minio') {
            $st = Container-State "$ComposeProject-$c-1"
            if ($st -ne 'healthy' -and $st -ne 'running') { $ready = $false }
        }
        if ($ready) { return }
        Start-Sleep -Seconds 2
    }
    Die 'db/minio non prets apres 60 s (docker compose -f deploy/docker-compose.yml ps)'
}

# ------------------------------------------------------- lancement service ---
function Run-Service {
    param([string]$Name, [string]$Dir, [string]$File, [string[]]$CmdArgs)

    $log = Join-Path $RunDir "$Name.log"
    $err = Join-Path $RunDir "$Name.err.log"
    $pidFile = Join-Path $RunDir "$Name.pid"

    if ($Bg) {
        Say "$Name - arriere-plan, log : scripts\.run\$Name.log"
        # via cmd.exe /c pour lancer aussi les .cmd (npm/mvnw) avec redirection ;
        # taskkill /T (Kill-PidFile) descendra dans l'arbre pour tuer java/node.
        $full = @('/c', $File) + $CmdArgs
        $p = Start-Process -FilePath $env:ComSpec -ArgumentList $full -WorkingDirectory $Dir `
            -RedirectStandardOutput $log -RedirectStandardError $err `
            -WindowStyle Hidden -PassThru
        Set-Content -Path $pidFile -Value $p.Id -Encoding ascii
        Say "$Name demarre (PID $($p.Id))"
    }
    else {
        Say "$Name - premier plan (Ctrl+C pour arreter)"
        Push-Location $Dir
        try { & $File @CmdArgs }
        finally { Pop-Location }
    }
}

# --------------------------------------------------------------- .env prod ---
function Ensure-ProdEnv {
    $f = Join-Path $RepoRoot 'deploy/.env.prod.local'
    if (Test-Path $f) { return }

    $e = @{}
    if (Test-Path $ComposeEnv) {
        Get-Content $ComposeEnv | ForEach-Object {
            if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$') { $e[$Matches[1]] = $Matches[2].Trim() }
        }
    }
    function V { param($k, $d) if ($e.ContainsKey($k) -and $e[$k]) { $e[$k] } else { $d } }
    $chars = [char[]]((48..57) + (65..90) + (97..122))
    $secret = -join (1..48 | ForEach-Object { $chars | Get-Random })

    @(
        '# Genere par scripts/datashare - profil prod contre la stack Docker DEV locale.'
        '# Local, non versionne (deploy/.env.* est gitignore). Supprimer pour regenerer.'
        "DATASHARE_DB_URL=jdbc:postgresql://localhost:$(V 'POSTGRES_PORT' '5432')/$(V 'POSTGRES_DB' 'datashare')"
        "DATASHARE_DB_USERNAME=$(V 'POSTGRES_USER' 'datashare')"
        "DATASHARE_DB_PASSWORD=$(V 'POSTGRES_PASSWORD' 'datashare')"
        "DATASHARE_JWT_SECRET=$secret"
        "DATASHARE_STORAGE_ENDPOINT=http://localhost:$(V 'MINIO_API_PORT' '9000')"
        "DATASHARE_STORAGE_BUCKET=$(V 'DATASHARE_STORAGE_BUCKET' 'datashare-files')"
        "DATASHARE_STORAGE_ACCESS_KEY=$(V 'MINIO_ROOT_USER' 'datashare')"
        "DATASHARE_STORAGE_SECRET_KEY=$(V 'MINIO_ROOT_PASSWORD' 'datashare-secret')"
        'DATASHARE_DOWNLOAD_BASE_URL=http://localhost:4200/d'
    ) | Set-Content -Path $f -Encoding ascii
    Say 'genere : deploy\.env.prod.local'
}

function Load-EnvFile {
    param([string]$path)
    Get-Content $path | ForEach-Object {
        if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$') {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2].Trim(), 'Process')
        }
    }
}

# ------------------------------------------------------------------- stop ----
function Kill-PidFile {
    param([string]$name)
    $pidFile = Join-Path $RunDir "$name.pid"
    if (-not (Test-Path $pidFile)) { return }
    $procId = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    if ($procId) {
        # arbre complet ; redirection DANS cmd pour que PowerShell ne voie pas le stderr
        # de taskkill quand le PID a deja disparu.
        & cmd /c "taskkill /T /F /PID $procId >nul 2>&1"
    }
}

function Kill-Pattern {
    param([string]$exe, [string]$pattern)
    Get-CimInstance Win32_Process -Filter "name='$exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -match $pattern } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

function Kill-Port {
    param([int]$port)
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

# ----------------------------------------------------------------- status ---
function Status-Appli {
    $fail = 0
    Say 'DataShare - statut'

    if (Http-Up "$BackendUrl/actuator/health") { Ok "backend    $BackendUrl" } else { Nok "backend    $BackendUrl"; $fail++ }
    if (Http-Up $FrontendUrl) { Ok "frontend   $FrontendUrl" } else { Nok "frontend   $FrontendUrl"; $fail++ }

    if (Have 'docker') {
        foreach ($c in 'db', 'minio', 'adminer') {
            $st = Container-State "$ComposeProject-$c-1"
            if ($st -eq 'healthy' -or $st -eq 'running') { Ok "docker $c ($st)" } else { Nok "docker $c ($st)"; $fail++ }
        }
    }
    else { Nok 'docker (client absent)'; $fail++ }

    Say ''
    if ($fail -eq 0) { Say 'tout est OK' } else { Say "$fail element(s) NOK" }
    exit $fail
}

# ----------------------------------------------------------------- dispatch --
switch ($Action) {
    'start-backend-dev' {
        Deps-Up
        Run-Service 'backend' (Join-Path $RepoRoot 'backend') (Mvnw-Bin) `
        @('-q', 'spring-boot:run', '-Dspring-boot.run.profiles=dev', '-Dspring-boot.run.fork=false')
    }
    'start-backend-prod' {
        Deps-Up
        Ensure-ProdEnv
        Say 'build du jar (mvnw -DskipTests package)...'
        Push-Location (Join-Path $RepoRoot 'backend')
        try { & (Mvnw-Bin) -q -DskipTests package; if ($LASTEXITCODE -ne 0) { Die 'mvnw package a echoue' } }
        finally { Pop-Location }
        $jar = Get-ChildItem (Join-Path $RepoRoot 'backend/target') -Filter 'datashare-backend-*.jar' |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $jar) { Die 'jar introuvable apres package' }
        Load-EnvFile (Join-Path $RepoRoot 'deploy/.env.prod.local')
        Run-Service 'backend' (Join-Path $RepoRoot 'backend') 'java' `
        @('-jar', $jar.FullName, '--spring.profiles.active=prod')
    }
    'start-frontend-dev' {
        Node-Check
        Run-Service 'frontend' (Join-Path $RepoRoot 'frontend') 'npm.cmd' @('start')
    }
    'start-frontend-prod' {
        Node-Check
        Run-Service 'frontend' (Join-Path $RepoRoot 'frontend') 'npm.cmd' @('run', 'start:prod')
    }
    'stop-backend' {
        Kill-PidFile 'backend'
        if ($Hard) { Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue }
        else { Kill-Pattern 'java.exe' 'spring-boot:run'; Kill-Pattern 'java.exe' 'datashare-backend' }
        Kill-Port 8080
        if ($WithDeps -and (Have 'docker')) {
            & docker compose --env-file $ComposeEnv -f $ComposeFile down 2>&1 | ForEach-Object { Write-Host $_ }
        }
        Say 'backend arrete'
    }
    'stop-frontend' {
        Kill-PidFile 'frontend'
        if ($Hard) { Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue }
        else { Kill-Pattern 'node.exe' 'ng(\s|\\)serve|@angular[\\/]build' }
        Kill-Port 4200
        Say 'frontend arrete'
    }
    { $_ -in 'status-appli', 'status' } { Status-Appli }   # fait son propre exit <nb NOK>
    default { Die "action inconnue : $Action  (essayez: status-appli)" }
}

# start-* / stop-* : sortie propre, quel que soit le dernier code natif rencontre.
exit 0
