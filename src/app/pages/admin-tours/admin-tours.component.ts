import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Tour } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-tours',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './admin-tours.component.html',
  styleUrl: './admin-tours.component.scss',
})
export class AdminToursComponent implements OnInit {
  toursForm: FormGroup;
  private apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.toursForm = this.fb.group({
      tours: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadTours();
  }

  get tours(): FormArray {
    return this.toursForm.get('tours') as FormArray;
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
  }

  private loadTours(): void {
    // Admin endpoint returns drafts as well; public /tours filters them out.
    this.http
      .get<Tour[]>(`${this.apiUrl}/tours/admin/all`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (tours) => {
          this.tours.clear();
          tours.forEach((tour) => {
            this.tours.push(this.createTourForm(tour));
          });
        },
        error: () => {
          this.snackBar.open('Failed to load tours', 'Close', { duration: 3000 });
        },
      });
  }

  private createTourForm(tour: Tour & { type?: string }): FormGroup {
    return this.fb.group({
      id: [tour.id],
      slug: [tour.slug || ''],
      title: [tour.title, Validators.required],
      type: [tour.type || 'enduro'],
      promo: [tour.promo || ''],
      description: [tour.description, Validators.required],
      priceEur: [tour.priceEur, [Validators.required, Validators.min(0)]],
      priceGbp: [tour.priceGbp, [Validators.required, Validators.min(0)]],
      promoPriceEur: [tour.promoPriceEur || null, Validators.min(0)],
      promoPriceGbp: [tour.promoPriceGbp || null, Validators.min(0)],
      promoEndDate: [tour.promoEndDate || ''],
      promoBookingPeriod: [tour.promoBookingPeriod || ''],
      image: [tour.image, Validators.required],
      duration: [tour.duration, Validators.required],
      durationDetails: [tour.durationDetails, Validators.required],
      averageDistance: [tour.averageDistance, Validators.required],
      difficulty: [tour.difficulty.join(', '), Validators.required],
      published: [tour.published ?? false],
      tourDetails: this.fb.array(
        tour.tourDetails.map((day) => this.createTourDayForm(day))
      ),
    });
  }

  private createTourDayForm(day: any): FormGroup {
    return this.fb.group({
      day: [day.day, [Validators.required, Validators.min(1)]],
      title: [day.title, Validators.required],
      description: [day.description, Validators.required],
      image: [day.image, Validators.required],
    });
  }

  getTourDays(tourIndex: number): FormArray {
    return this.tours.at(tourIndex).get('tourDetails') as FormArray;
  }

  addTourDay(tourIndex: number): void {
    const tourDays = this.getTourDays(tourIndex);
    const newDay = tourDays.length + 1;
    tourDays.push(
      this.createTourDayForm({
        day: newDay,
        title: '',
        description: '',
        image: '',
      })
    );
  }

  removeTourDay(tourIndex: number, dayIndex: number): void {
    const tourDays = this.getTourDays(tourIndex);
    tourDays.removeAt(dayIndex);
    tourDays.controls.forEach((control, index) => {
      control.get('day')?.setValue(index + 1);
    });
  }

  saveTour(tourIndex: number): void {
    const tourControl = this.tours.at(tourIndex);
    if (tourControl.invalid) {
      tourControl.markAllAsTouched();
      this.snackBar.open('Fill in all required fields before saving.', 'Close', { duration: 4000 });
      return;
    }

    const formValue = tourControl.value;
    const tourData = {
      ...formValue,
      difficulty: formValue.difficulty
        .split(',')
        .map((d: string) => d.trim())
        .filter((d: string) => d),
    };

    const { id, ...body } = tourData;

    if (id) {
      this.http
        .patch(`${this.apiUrl}/tours/${id}`, body, {
          headers: this.getAuthHeaders(),
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Tour updated successfully', 'Close', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to update tour', 'Close', { duration: 3000 });
          },
        });
    } else {
      this.http
        .post<Tour>(`${this.apiUrl}/tours`, body, {
          headers: this.getAuthHeaders(),
        })
        .subscribe({
          next: (created) => {
            this.tours.at(tourIndex).get('id')?.setValue(created.id);
            this.snackBar.open('Tour created successfully', 'Close', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to create tour', 'Close', { duration: 3000 });
          },
        });
    }
  }

  deleteTour(tourIndex: number): void {
    const id = this.tours.at(tourIndex).get('id')?.value;
    if (!id || !confirm('Are you sure you want to delete this tour?')) return;

    this.http
      .delete(`${this.apiUrl}/tours/${id}`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: () => {
          this.tours.removeAt(tourIndex);
          this.snackBar.open('Tour deleted', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to delete tour', 'Close', { duration: 3000 });
        },
      });
  }

  addNewTour(): void {
    const emptyTour: any = {
      id: '',
      slug: '',
      title: '',
      type: 'enduro',
      description: '',
      priceEur: 0,
      priceGbp: 0,
      image: '',
      duration: '',
      durationDetails: '',
      averageDistance: '',
      difficulty: [],
      tourDetails: [],
      // New tours start as drafts — invisible to the public until explicitly
      // published from the toggle below.
      published: false,
    };
    this.tours.push(this.createTourForm(emptyTour));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  goToBookings(): void {
    this.router.navigate(['/admin/bookings']);
  }
}
