@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0datashare.ps1" stop-backend %*
