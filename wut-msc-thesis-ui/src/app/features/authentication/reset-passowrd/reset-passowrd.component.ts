import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-passowrd',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './reset-passowrd.component.html',
  styleUrl: './reset-passowrd.component.css'
})
export class ResetPassowrdComponent {

resetForm = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email])
});

onSubmit() {
  if (this.resetForm.valid) {
    const email = this.resetForm.value.email;
    console.log('Reset password link sent to:', email);
    // Call backend here
  }
}
}