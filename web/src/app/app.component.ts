import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';

interface NavGroup {
  label: string;
  icon: string;
  expanded: boolean;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatExpansionModule
  ],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <div class="sidenav-header">
          <mat-icon>dashboard</mat-icon>
          <span>Personal Tracker</span>
        </div>

        <mat-accordion displayMode="flat" multi>
          @for (group of navGroups; track group.label) {
            <mat-expansion-panel [expanded]="group.expanded" class="nav-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>{{ group.icon }}</mat-icon>
                  {{ group.label }}
                </mat-panel-title>
              </mat-expansion-panel-header>
              <mat-nav-list dense>
                @for (item of group.items; track item.route) {
                  <a mat-list-item [routerLink]="item.route" routerLinkActive="active">
                    <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                    <span matListItemTitle>{{ item.label }}</span>
                  </a>
                }
              </mat-nav-list>
            </mat-expansion-panel>
          }
        </mat-accordion>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span>Personal Tracker</span>
          <span class="spacer"></span>
          <button mat-icon-button>
            <mat-icon>account_circle</mat-icon>
          </button>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container {
      height: 100vh;
    }

    .sidenav {
      width: 260px;
      background: #fafafa;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      font-size: 18px;
      font-weight: 500;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);

      mat-icon {
        color: #1976d2;
      }
    }

    mat-accordion {
      display: block;
    }

    .nav-panel {
      box-shadow: none !important;
      background: transparent;

      ::ng-deep .mat-expansion-panel-body {
        padding: 0;
      }
    }

    .nav-panel mat-panel-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;

      mat-icon {
        color: rgba(0, 0, 0, 0.6);
      }
    }

    mat-nav-list {
      padding-top: 0;
    }

    mat-nav-list a {
      padding-left: 48px;
    }

    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .main-content {
      background: #f5f5f5;
      min-height: calc(100vh - 64px);
    }

    .active {
      background: rgba(25, 118, 210, 0.1);

      mat-icon {
        color: #1976d2 !important;
      }
    }
  `]
})
export class AppComponent {
  title = 'Personal Tracker';

  navGroups: NavGroup[] = [
    {
      label: 'Trade Tracker',
      icon: 'show_chart',
      expanded: true,
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Transactions', icon: 'receipt_long', route: '/transactions' },
      ]
    },
    {
      label: 'Swim Tracker',
      icon: 'pool',
      expanded: false,
      items: [
        { label: 'PR Dashboard', icon: 'emoji_events', route: '/swim' },
        { label: 'Log Time', icon: 'timer', route: '/swim/log' },
        { label: 'All Times', icon: 'list', route: '/swim/times' },
        { label: 'Profiles', icon: 'person', route: '/swim/profiles' }
      ]
    },
    {
      label: 'Net Worth',
      icon: 'account_balance',
      expanded: false,
      items: [
        { label: 'Dashboard', icon: 'pie_chart', route: '/networth' },
        { label: 'New Snapshot', icon: 'add_circle', route: '/networth/snapshot/new' },
        { label: 'History', icon: 'history', route: '/networth/snapshots' },
        { label: 'Trend', icon: 'show_chart', route: '/networth/trend' },
        { label: 'Accounts', icon: 'account_balance_wallet', route: '/networth/accounts' }
      ]
    }
  ];
}
