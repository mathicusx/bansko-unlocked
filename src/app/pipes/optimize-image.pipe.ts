import { Pipe, PipeTransform } from '@angular/core';

// Local-asset folders for which we have pre-generated `-md.webp` (~700w q50)
// and `-lg.webp` (~1400w q60) responsive variants (sharp conversion run,
// 2026-05-23). Tour image URLs stored in the DB still end in `.jpg` (no DB
// migration), so the pipe rewrites them at render time. Keep this list in
// sync if new bulk-converted folders are added — a missing variant would 404.
const LOCAL_WEBP_FOLDERS = ['assets/enduro-gallery/'];

/** Route to the right responsive variant: anything ≤ 800w gets the small
 *  `-md` build (homepage tour cards, day-timeline images, feature cards);
 *  larger consumers (tour-detail hero) get `-lg`. */
function localWebpVariantSuffix(targetWidth: number): string {
  return targetWidth <= 800 ? '-md.webp' : '-lg.webp';
}

@Pipe({ name: 'optimize', standalone: true, pure: true })
export class OptimizeImagePipe implements PipeTransform {
  transform(url: string | null | undefined, width: number = 1200): string {
    if (!url) return '';
    // Local asset → swap .jpg for the appropriate `-md` / `-lg` WebP variant.
    if (
      /\.(jpe?g)$/i.test(url) &&
      LOCAL_WEBP_FOLDERS.some((p) => url.includes(p))
    ) {
      return url.replace(/\.(jpe?g)$/i, localWebpVariantSuffix(width));
    }
    if (!url.includes('/image/upload/')) return url;
    if (url.includes('/upload/f_auto') || url.includes('/upload/q_auto')) return url;
    return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
}

@Pipe({ name: 'srcset', standalone: true, pure: true })
export class CloudinarySrcsetPipe implements PipeTransform {
  transform(url: string | null | undefined, widths: number[] = [400, 800, 1200, 1600]): string {
    if (!url || !url.includes('/image/upload/')) return '';
    return widths
      .map((w) => {
        const transformed = url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${w},c_limit/`);
        return `${transformed} ${w}w`;
      })
      .join(', ');
  }
}
