import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private cloudName = 'buriproperties';
  private uploadPreset = 'Enduro-brothers';
  private uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    return this.http
      .post<{ secure_url: string }>(this.uploadUrl, formData)
      .pipe(map((res) => res.secure_url));
  }

  optimize(url: string | null | undefined, width = 1200): string {
    if (!url) return '';
    if (!url.includes('/image/upload/')) return url;
    if (url.includes('/upload/f_auto') || url.includes('/upload/q_auto')) return url;
    return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
  }

  srcset(url: string | null | undefined, widths: number[] = [400, 800, 1200, 1600]): string {
    if (!url || !url.includes('/image/upload/')) return '';
    return widths.map((w) => `${this.optimize(url, w)} ${w}w`).join(', ');
  }
}
