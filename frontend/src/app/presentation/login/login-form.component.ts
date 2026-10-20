import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { LoginUseCase } from '../../application/login.use-case';
import { validateEmail, validatePassword } from '../../domain/login/login-validation';
import { LOGIN_MESSAGES } from '../../domain/login/messages';

type AuthErrorKind = 'invalid-credentials' | 'unavailable';
type FieldId = 'email' | 'password';

interface SummaryItem {
  id: FieldId;
  message: string;
}

function emailValidator(control: AbstractControl): ValidationErrors | null {
  const error = validateEmail(control.value);
  return error ? { [error]: true } : null;
}

function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const error = validatePassword(control.value);
  return error ? { [error]: true } : null;
}

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  private readonly login = inject(LoginUseCase);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly messages = LOGIN_MESSAGES;
  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [emailValidator] }),
    password: new FormControl('', { nonNullable: true, validators: [passwordValidator] }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });
  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly authError = signal<AuthErrorKind | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.authError.set(null));
  }

  protected emailError(): string | null {
    const control = this.form.controls.email;
    if (!this.shouldShow(control) || control.valid) {
      return null;
    }
    return control.hasError('required') ? LOGIN_MESSAGES.email.required : LOGIN_MESSAGES.email.invalid;
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;
    if (!this.shouldShow(control) || control.valid) {
      return null;
    }
    if (control.hasError('required')) {
      return LOGIN_MESSAGES.password.required;
    }
    return control.hasError('too-short') ? LOGIN_MESSAGES.password.tooShort : LOGIN_MESSAGES.password.tooLong;
  }

  protected summaryItems(): SummaryItem[] {
    if (!this.submitted()) {
      return [];
    }
    const items: SummaryItem[] = [];
    const email = this.emailError();
    const password = this.passwordError();
    if (email) {
      items.push({ id: 'email', message: email });
    }
    if (password) {
      items.push({ id: 'password', message: password });
    }
    return items;
  }

  protected markTouched(id: FieldId): void {
    this.form.controls[id].markAsTouched();
  }

  protected togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected showFeatureUnavailable(): void {
    this.notice.set(LOGIN_MESSAGES.featureUnavailable);
  }

  protected async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.authError.set(null);
    this.notice.set(null);

    if (this.form.invalid) {
      this.focusField(this.summaryItems()[0]?.id ?? 'email');
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    try {
      const result = await this.login.execute({ email, password });
      if (result.status === 'invalid-credentials') {
        this.submitted.set(false);
        this.form.controls.password.reset('');
        this.authError.set('invalid-credentials');
        this.focusField('password');
      } else if (result.status === 'unavailable') {
        this.submitted.set(false);
        this.authError.set('unavailable');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private shouldShow(control: AbstractControl): boolean {
    return this.submitted() || control.touched;
  }

  private focusField(id: FieldId): void {
    this.host.nativeElement.querySelector<HTMLInputElement>(`#${id}`)?.focus();
  }
}
