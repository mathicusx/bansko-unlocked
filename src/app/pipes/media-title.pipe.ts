import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mediaTitlePipe',
  standalone: true
})
export class MediaTitlePipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return '';
    
    // Extract filename from path
    const filename = value.split('/').pop() || value;
    
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Convert to readable format
    return nameWithoutExt
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}