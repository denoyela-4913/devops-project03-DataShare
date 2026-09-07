package com.datashare.maintenance;

/**
 * Bilan d'une purge : {@code deletedCount} lignes retirées, {@code storageFailures}
 * objets qui n'ont pas pu être supprimés du stockage (ligne quand même retirée).
 */
public record PurgeReport(int deletedCount, int storageFailures) {}
