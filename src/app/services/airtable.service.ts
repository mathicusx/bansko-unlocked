import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

export interface AirtableResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AirtableService {
  private readonly baseUrl = 'https://api.airtable.com/v0';
  private readonly baseId = environment.airtable.baseId;
  private readonly apiKey = environment.airtable.apiKey;

  private readonly headers = new HttpHeaders({
    Authorization: `Bearer ${this.apiKey}`,
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  getRecords<T>(
    tableName: string,
    params?: any
  ): Observable<AirtableRecord<T>[]> {
    const url = `${this.baseUrl}/${this.baseId}/${tableName}`;

    return this.http
      .get<AirtableResponse<T>>(url, { 
        headers: this.headers,
        params: params 
      })
      .pipe(
        map((response) => response.records),
        catchError(this.handleError)
      );
  }

  createRecord<T>(tableName: string, fields: T): Observable<AirtableRecord<T>> {
    const url = `${this.baseUrl}/${this.baseId}/${tableName}`;
    const body = { records: [{ fields }] };

    return this.http
      .post<AirtableResponse<T>>(url, body, { headers: this.headers })
      .pipe(
        map(response => response.records[0]), // Return the first (and only) created record
        catchError(this.handleError)
      );
  }

  updateRecord<T>(
    tableName: string,
    recordId: string,
    fields: Partial<T>
  ): Observable<AirtableRecord<T>> {
    const url = `${this.baseUrl}/${this.baseId}/${tableName}/${recordId}`;
    const body = { fields };

    return this.http
      .patch<AirtableRecord<T>>(url, body, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Airtable API Error:', error);
    return throwError(() => new Error('Airtable operation failed'));
  }
}
