import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePassowrdComponent } from './change-passowrd.component';

describe('ChangePassowrdComponent', () => {
  let component: ChangePassowrdComponent;
  let fixture: ComponentFixture<ChangePassowrdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePassowrdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangePassowrdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
