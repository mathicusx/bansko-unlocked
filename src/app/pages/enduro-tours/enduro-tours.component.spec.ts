import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnduroToursComponent } from './enduro-tours.component';

describe('EnduroToursComponent', () => {
  let component: EnduroToursComponent;
  let fixture: ComponentFixture<EnduroToursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnduroToursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnduroToursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
