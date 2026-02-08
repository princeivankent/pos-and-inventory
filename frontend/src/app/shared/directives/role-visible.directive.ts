import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { StoreContextService } from '../../core/services/store-context.service';
import { UserRole } from '../../core/models/enums';

@Directive({ selector: '[appRoleVisible]', standalone: true })
export class RoleVisibleDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private storeContext = inject(StoreContextService);
  private hasView = false;

  @Input() set appRoleVisible(role: UserRole) {
    effect(() => {
      const currentRole = this.storeContext.currentRole();
      const shouldShow = currentRole === role || currentRole === UserRole.ADMIN;

      if (shouldShow && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!shouldShow && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
