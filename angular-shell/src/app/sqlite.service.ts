import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, defer, from, merge, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';

interface WriteResult {
  changes: number;
  lastInsertRowid: number;
}

interface PlasticinaDb {
  ready: Promise<void>;
  isReady(): boolean;
  version(): number;
  revision(): number;
  all(sql: string, params?: unknown[]): Record<string, unknown>[];
  get(sql: string, params?: unknown[]): Record<string, unknown> | null;
  run(sql: string, params?: unknown[]): WriteResult;
  transaction<T>(work: () => T): Promise<T>;
  ensureFresh(): Promise<void>;
  flush(): Promise<unknown>;
  onExternalChange(listener: (change: unknown) => void): () => void;
}

export interface DbStatus {
  ready: boolean;
  version: number;
  revision: number;
  error: string;
}

declare global {
  interface Window {
    Plasticina?: { db?: PlasticinaDb };
  }
}

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private readonly statusSubject = new BehaviorSubject<DbStatus>({
    ready: false,
    version: 0,
    revision: 0,
    error: ''
  });

  private readonly externalChangeSubject = new BehaviorSubject<unknown>(null);

  readonly status$ = this.statusSubject.asObservable();

  readonly ready$: Observable<void> = defer(() => {
    const db = this.database();
    return from(db.ready).pipe(
      tap(() => this.publish()),
      catchError((error: unknown) => {
        this.publish(this.message(error));
        throw error;
      })
    );
  }).pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly externalChange$ = this.externalChangeSubject.asObservable();

  readonly revision$: Observable<number> = merge(
    this.status$.pipe(map((status) => status.revision)),
    this.externalChange$.pipe(map(() => this.database().revision()))
  ).pipe(shareReplay({ bufferSize: 1, refCount: false }));

  private database(): PlasticinaDb {
    const db = window.Plasticina && window.Plasticina.db;
    if (!db) {
      throw new Error('El core SQLite de Plasticina no está disponible en este documento.');
    }
    return db;
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private publish(error?: string): void {
    const db = window.Plasticina && window.Plasticina.db;
    this.statusSubject.next({
      ready: Boolean(db && db.isReady()),
      version: db ? db.version() : 0,
      revision: db ? db.revision() : 0,
      error: error || ''
    });
  }

  watchExternalChanges(): void {
    this.ready$.pipe(
      switchMap(() => defer(() => {
        const db = this.database();
        db.onExternalChange((change) => {
          this.externalChangeSubject.next(change);
          this.publish();
        });
        return of(undefined);
      }))
    ).subscribe();
  }

  query<T extends Record<string, unknown>[]>(sql: string, params: unknown[] = []): Observable<T> {
    return this.ready$.pipe(
      switchMap(() => from(this.database().ensureFresh())),
      map(() => this.database().all(sql, params) as T),
      tap(() => this.publish()),
      catchError((error: unknown) => {
        this.publish(this.message(error));
        return of([] as unknown as T);
      })
    );
  }

  first<T extends Record<string, unknown>>(sql: string, params: unknown[] = []): Observable<T | null> {
    return this.ready$.pipe(
      switchMap(() => from(this.database().ensureFresh())),
      map(() => this.database().get(sql, params) as T | null),
      tap(() => this.publish()),
      catchError((error: unknown) => {
        this.publish(this.message(error));
        return of(null);
      })
    );
  }

  write<T>(work: () => T): Observable<T | null> {
    return this.ready$.pipe(
      switchMap(() => from(this.database().transaction(work))),
      tap(() => this.publish()),
      catchError((error: unknown) => {
        this.publish(this.message(error));
        return of(null);
      })
    );
  }

  flush(): Observable<void> {
    return defer(() => from(this.database().flush())).pipe(
      map(() => undefined),
      tap(() => this.publish()),
      catchError((error: unknown) => {
        this.publish(this.message(error));
        return of(undefined);
      })
    );
  }
}
