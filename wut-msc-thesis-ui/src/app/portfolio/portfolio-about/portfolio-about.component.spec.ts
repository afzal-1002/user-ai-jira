import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioAboutComponent } from './portfolio-about.component';

describe('PortfolioAboutComponent', () => {
  let component: PortfolioAboutComponent;
  let fixture: ComponentFixture<PortfolioAboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioAboutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioAboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
