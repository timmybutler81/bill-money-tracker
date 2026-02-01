import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { map, Observable, shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { User } from 'firebase/auth';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LayoutModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})

export class Shell {
  isHandset$!: Observable<boolean>;
  user$!: Observable<User | null>;

  constructor(
  private breakpointObserver: BreakpointObserver,
  public auth: AuthService,
  private router: Router
) {
  this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay()
  );

  this.user$ = this.auth.user$;
  this.auth.user$
  .pipe(
    filter((user) => user === null),
    takeUntilDestroyed()
  )
  .subscribe(() => {
    this.router.navigateByUrl('/login');
  });
}

onAvatarError(evt: Event) {
  const img = evt.target as HTMLImageElement;
  img.style.display = 'none';
}

logout() {
  this.auth.logout();
}


async onLogout() {
  await this.auth.logout();
  await this.router.navigateByUrl('/login');
}

}
