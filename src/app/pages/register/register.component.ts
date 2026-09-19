import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  errorMessage = '';
  passwordVisible = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.loginEnabled) {
      this.router.navigate(['/calculate-profit']);
    }
  }

  submit(): void {

    if (this.form.invalid || this.submitting) {
      return;
    }

    this.errorMessage = '';
    this.submitting = true;

    const { username, password } = this.form.value;

    this.authService.register(username!, password!).subscribe({
      next: () => this.router.navigate(['/calculate-profit']),
      error: error => {
        this.submitting = false;
        this.errorMessage = error?.status === 409
          ? 'That username is already taken'
          : error?.error?.message ?? 'Could not create the account';
      },
    });
  }
}

function passwordsMatch(group: AbstractControl) {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return !confirm || password === confirm ? null : { passwordsMismatch: true };
}
