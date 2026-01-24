import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { effect } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  constructor(private auth: AuthService, private router: Router) {
  effect(() => {
    const user = this.auth.currentUser;
    if (user) {
      this.router.navigateByUrl('/dashboard');
    }
  });
}

  async signIn() {
    await this.auth.loginWithGoogle();
    await this.router.navigateByUrl('/dashboard');
  }
}
