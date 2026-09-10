package com.datashare.maintenance;

/**
 * Bilan d'une purge : {@code deletedCount} lignes retirées, {@code storageFailures}
 * objets qui n'ont pas pu être supprimés du stockage (ligne quand même retirée).
 */
public record PurgeReport(int deletedCount, int storageFailures) {

    /** Code de sortie du processus : 1 si au moins un objet de stockage a résisté, 0 sinon. */
    public int exitCode() {
        return storageFailures > 0 ? 1 : 0;
    }
}
