import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioTimelineComponent } from './portfolio-timeline.component';

describe('PortfolioTimelineComponent', () => {
  let component: PortfolioTimelineComponent;
  let fixture: ComponentFixture<PortfolioTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
