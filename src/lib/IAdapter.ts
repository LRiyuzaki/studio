/**
 * @file Defines the IReadWriteAdapter interface for abstracting data sources.
 * This ensures that both local (IndexedDB) and remote (Firestore) data
 * sources can be used interchangeably by the application's data logic.
 */

export interface IReadWriteAdapter<T> {
    /**
     * Reads a single item by its ID.
     * @param id The unique identifier of the item to read.
     * @returns A promise that resolves to the item or null if not found.
     */
    read(id: string): Promise<T | null>;

    /**
     * Writes an item to the data source.
     * @param item The item to write.
     * @returns A promise that resolves when the write is complete.
     */
    write(item: T): Promise<void>;
    
    /**
     * Reads all items from the data source.
     * @returns A promise that resolves to an array of all items.
     */
    readAll(): Promise<T[]>;

    /**
     * Deletes an item by its ID.
     * @param id The unique identifier of the item to delete.
     * @returns A promise that resolves when the deletion is complete.
     */
    delete(id: string): Promise<void>;
}
