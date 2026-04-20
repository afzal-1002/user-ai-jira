import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioContactComponent } from './portfolio-contact.component';

describe('PortfolioContactComponent', () => {
  let component: PortfolioContactComponent;
  let fixture: ComponentFixture<PortfolioContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioContactComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
