import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  // ─── Activities (static landing pages) ──────────────────────────────────
  // The new core of Bansko Unlocked. `/activities` lists all activities;
  // `/activities/:slug` renders one (data in src/app/data/activities.data.ts).
  {
    path: 'activities',
    loadComponent: () => import('./pages/activities/activities.component').then(m => m.ActivitiesComponent)
  },
  {
    path: 'activities/:slug',
    loadComponent: () => import('./pages/activity/activity.component').then(m => m.ActivityComponent)
  },

  // ─── Standing static pages ──────────────────────────────────────────────
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'team',
    loadComponent: () => import('./pages/team/team.component').then(m => m.TeamComponent)
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery.component').then(m => m.GalleryComponent)
  },
  {
    path: 'reviews',
    loadComponent: () => import('./pages/reviews/reviews.component').then(m => m.ReviewsComponent)
  },
  {
    path: 'faq',
    loadComponent: () => import('./components/faq/faq.component').then(m => m.FaqComponent)
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog.component').then(m => m.BlogComponent)
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog-detail/blog-detail.component').then(m => m.BlogDetailComponent)
  },

  // ─── Dormant: itinerary / booking system (enduro + buggy tours) ──────────
  // Commented out, NOT deleted — Bansko Unlocked may revive multi-day itinerary
  // packages later. The component files stay on disk; the live API and these
  // routes are simply not wired. The same applies to the enduro-specific
  // difficulty-levels / no-licence landing pages and the accommodation page
  // (hidden for now, may return). To revive: uncomment the relevant route, add
  // its nav link back (app.component), and re-add it to the sitemap generator.
  //
  // {
  //   path: 'enduro-tours',
  //   loadComponent: () => import('./pages/booking/booking.component').then(m => m.BookingComponent)
  // },
  // {
  //   path: 'tour/:id',
  //   loadComponent: () => import('./pages/tour-detail/tour-detail.component').then(m => m.TourDetailComponent)
  // },
  // {
  //   path: 'buggy-tours',
  //   loadComponent: () => import('./pages/buggy-tours/buggy-tours.component').then(m => m.BuggyToursComponent)
  // },
  // {
  //   path: 'buggy-tour/:id',
  //   loadComponent: () => import('./pages/buggy-tour-detail/buggy-tour-detail.component').then(m => m.BuggyTourDetailComponent)
  // },
  // {
  //   path: 'difficulty-levels',
  //   loadComponent: () => import('./pages/difficulty-levels/difficulty-levels.component').then(m => m.DifficultyLevelsComponent)
  // },
  // {
  //   path: 'no-licence-enduro-bulgaria',
  //   loadComponent: () => import('./pages/no-licence/no-licence.component').then(m => m.NoLicenceComponent)
  // },
  // {
  //   path: 'accommodation',
  //   loadComponent: () => import('./pages/accommodation/accommodation.component').then(m => m.AccommodationComponent)
  // },

  // ─── Admin (noindex, auth-gated) ────────────────────────────────────────
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin/tours',
    loadComponent: () => import('./pages/admin-tours/admin-tours.component').then(m => m.AdminToursComponent)
  },
  {
    path: 'admin/bookings',
    loadComponent: () => import('./pages/admin-bookings/admin-bookings.component').then(m => m.AdminBookingsComponent)
  },

  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
