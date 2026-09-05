package com.datashare.file.dto;

/** Corps de {@code POST /api/d/{token}}. {@code password} est {@code null} pour un fichier public. */
public record DownloadRequest(String password) {}
