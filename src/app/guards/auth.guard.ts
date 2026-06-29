import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/admin/login']);
    return false;
  }

  return authService.verify().pipe(
    map((valid) => {
      if (!valid) {
        router.navigate(['/admin/login']);
        return false;
      }
      return true;
    })
  );
};
