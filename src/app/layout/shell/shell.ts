import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { map, Observable, shareReplay, firstValueFrom } from 'rxjs';
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
import { MatSidenav } from '@angular/material/sidenav';

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
  @ViewChild('drawer') drawer!: MatSidenav;

  user$!: Observable<User | null>;

  // 👇 boolean for imperative logic (click handlers)
  isHandset = false;

  // 👇 observable for template bindings (async pipe)
  isHandset$: Observable<boolean>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public auth: AuthService,
    private router: Router
  ) {
    // SINGLE source of truth
    this.isHandset$ = this.breakpointObserver
      .observe('(max-width: 900px)')
      .pipe(
        map(result => result.matches),
        shareReplay(1)
      );

    // Sync observable → boolean
    this.isHandset$
      .pipe(takeUntilDestroyed())
      .subscribe(isHandset => {
        this.isHandset = isHandset;
      });

    this.user$ = this.auth.user$;

    this.auth.user$
      .pipe(
        filter(user => user === null),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.router.navigateByUrl('/login');
      });
  }

  closeIfHandset(drawer: MatSidenav): void {
    if (this.isHandset) {
      drawer.close();
    }
  }

  onAvatarError(evt: Event) {
    const img = evt.target as HTMLImageElement;
    img.style.display = 'none';
  }

  async onLogout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}

