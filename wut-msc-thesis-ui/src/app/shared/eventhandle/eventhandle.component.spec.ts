import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventhandleComponent } from './eventhandle.component';

describe('EventhandleComponent', () => {
  let component: EventhandleComponent;
  let fixture: ComponentFixture<EventhandleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventhandleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventhandleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
