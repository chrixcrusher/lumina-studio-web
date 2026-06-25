#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Compatibility wrapper that syncs all AI adapter targets.
.DESCRIPTION
    Delegates to scripts/sync-ai-adapters.ps1 -Target all.
    Kept as a convenience alias for the full sync command.
#>

$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "sync-ai-adapters.ps1") -Target all
