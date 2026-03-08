import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_PREFIX = 'erp_db_';
const DB_META_KEY = 'erp_db_meta';

interface DBMeta {
  version: string;
  lastBackup: string | null;
  totalRecords: number;
  createdAt: string;
  updatedAt: string;
}

interface QueryResult<T> {
  data: T[];
  count: number;
  timestamp: string;
}

interface DBStats {
  tables: { name: string; records: number; sizeKB: number }[];
  totalRecords: number;
  totalSizeKB: number;
  lastUpdated: string;
}

class LocalDatabase {
  private cache: Map<string, any[]> = new Map();

  async initialize(): Promise<void> {
    try {
      const meta = await AsyncStorage.getItem(DB_META_KEY);
      if (!meta) {
        const initialMeta: DBMeta = {
          version: '2.0.0',
          lastBackup: null,
          totalRecords: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(DB_META_KEY, JSON.stringify(initialMeta));
        console.log('[DB] Database initialized');
      }
    } catch (error) {
      console.error('[DB] Init error:', error);
    }
  }

  async getTable<T>(tableName: string): Promise<T[]> {
    try {
      const cached = this.cache.get(tableName);
      if (cached) return cached as T[];

      const key = DB_PREFIX + tableName;
      const data = await AsyncStorage.getItem(key);
      const parsed = data ? JSON.parse(data) : [];
      this.cache.set(tableName, parsed);
      return parsed;
    } catch (error) {
      console.error(`[DB] Error reading table ${tableName}:`, error);
      return [];
    }
  }

  async setTable<T>(tableName: string, data: T[]): Promise<boolean> {
    try {
      const key = DB_PREFIX + tableName;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      this.cache.set(tableName, data);
      await this.updateMeta();
      console.log(`[DB] Table ${tableName} saved: ${data.length} records`);
      return true;
    } catch (error) {
      console.error(`[DB] Error writing table ${tableName}:`, error);
      return false;
    }
  }

  async insert<T extends { id: string }>(tableName: string, record: T): Promise<boolean> {
    try {
      const data = await this.getTable<T>(tableName);
      const exists = data.find((r) => r.id === record.id);
      if (exists) {
        console.warn(`[DB] Record ${record.id} already exists in ${tableName}`);
        return false;
      }
      data.push(record);
      return this.setTable(tableName, data);
    } catch (error) {
      console.error(`[DB] Insert error in ${tableName}:`, error);
      return false;
    }
  }

  async update<T extends { id: string }>(
    tableName: string,
    id: string,
    updates: Partial<T>
  ): Promise<boolean> {
    try {
      const data = await this.getTable<T>(tableName);
      const index = data.findIndex((r) => r.id === id);
      if (index === -1) {
        console.warn(`[DB] Record ${id} not found in ${tableName}`);
        return false;
      }
      data[index] = { ...data[index], ...updates };
      return this.setTable(tableName, data);
    } catch (error) {
      console.error(`[DB] Update error in ${tableName}:`, error);
      return false;
    }
  }

  async deleteRecord<T extends { id: string }>(tableName: string, id: string): Promise<boolean> {
    try {
      const data = await this.getTable<T>(tableName);
      const filtered = data.filter((r) => r.id !== id);
      if (filtered.length === data.length) {
        console.warn(`[DB] Record ${id} not found in ${tableName}`);
        return false;
      }
      return this.setTable(tableName, filtered);
    } catch (error) {
      console.error(`[DB] Delete error in ${tableName}:`, error);
      return false;
    }
  }

  async query<T>(
    tableName: string,
    filter?: (item: T) => boolean,
    sort?: (a: T, b: T) => number,
    limit?: number
  ): Promise<QueryResult<T>> {
    try {
      let data = await this.getTable<T>(tableName);
      if (filter) data = data.filter(filter);
      if (sort) data.sort(sort);
      if (limit) data = data.slice(0, limit);
      return {
        data,
        count: data.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[DB] Query error in ${tableName}:`, error);
      return { data: [], count: 0, timestamp: new Date().toISOString() };
    }
  }

  async getStats(): Promise<DBStats> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const erpKeys = allKeys.filter((k) => k.startsWith('erp_'));
      const tables: DBStats['tables'] = [];
      let totalRecords = 0;
      let totalSize = 0;

      for (const key of erpKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          const sizeKB = parseFloat((val.length / 1024).toFixed(2));
          totalSize += sizeKB;
          try {
            const parsed = JSON.parse(val);
            const records = Array.isArray(parsed) ? parsed.length : 1;
            totalRecords += records;
            tables.push({
              name: key.replace('erp_', ''),
              records,
              sizeKB,
            });
          } catch {
            tables.push({ name: key.replace('erp_', ''), records: 1, sizeKB });
          }
        }
      }

      return {
        tables: tables.sort((a, b) => b.sizeKB - a.sizeKB),
        totalRecords,
        totalSizeKB: parseFloat(totalSize.toFixed(2)),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[DB] Stats error:', error);
      return { tables: [], totalRecords: 0, totalSizeKB: 0, lastUpdated: new Date().toISOString() };
    }
  }

  async exportAll(): Promise<string> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const erpKeys = allKeys.filter((k) => k.startsWith('erp_'));
      const exportData: Record<string, any> = {};

      for (const key of erpKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          try {
            exportData[key] = JSON.parse(val);
          } catch {
            exportData[key] = val;
          }
        }
      }

      exportData._meta = {
        exportDate: new Date().toISOString(),
        version: '2.0.0',
        tables: Object.keys(exportData).length,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('[DB] Export error:', error);
      throw error;
    }
  }

  async importAll(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonString);
      const keys = Object.keys(data).filter((k) => k !== '_meta');

      for (const key of keys) {
        await AsyncStorage.setItem(key, JSON.stringify(data[key]));
      }

      this.cache.clear();
      await this.updateMeta();

      return { success: true, message: `Imported ${keys.length} tables successfully` };
    } catch (error) {
      console.error('[DB] Import error:', error);
      return { success: false, message: 'Failed to import data. Invalid format.' };
    }
  }

  async clearAll(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const erpKeys = allKeys.filter((k) => k.startsWith('erp_'));
      await AsyncStorage.multiRemove(erpKeys);
      this.cache.clear();
      console.log(`[DB] Cleared ${erpKeys.length} keys`);
      return true;
    } catch (error) {
      console.error('[DB] Clear error:', error);
      return false;
    }
  }

  async createAutoBackup(): Promise<boolean> {
    try {
      const data = await this.exportAll();
      const backupKey = `erp_backup_${new Date().toISOString().split('T')[0]}`;
      await AsyncStorage.setItem(backupKey, data);
      console.log(`[DB] Auto backup created: ${backupKey}`);
      return true;
    } catch (error) {
      console.error('[DB] Auto backup error:', error);
      return false;
    }
  }

  private async updateMeta(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(DB_META_KEY);
      const meta: DBMeta = existing
        ? JSON.parse(existing)
        : { version: '2.0.0', lastBackup: null, totalRecords: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      meta.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(DB_META_KEY, JSON.stringify(meta));
    } catch (error) {
      console.error('[DB] Meta update error:', error);
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('[DB] Cache cleared');
  }
}

export const db = new LocalDatabase();
export type { DBMeta, QueryResult, DBStats };
