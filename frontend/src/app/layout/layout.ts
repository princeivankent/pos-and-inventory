import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';
import { HeaderComponent } from './header/header';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <app-sidebar />
    <div class="main-area">
      <app-header />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      min-height: 100vh;
    }
    .main-area {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex: 1;
      padding: 1.5rem;
      background: var(--bg-secondary);
      overflow-y: auto;
    }
  `,
})
export class LayoutComponent {}
