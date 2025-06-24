import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EditComponent } from './edit/edit.component';
import { authGuard } from '../guards/auth.guard';
import { roleGuard } from '../guards/role.guard';
import { UserProfileComponent } from '../public/components/user-profile/user-profile.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard]
  },
  {
    path: 'edit/:uuid',
    component: EditComponent,
    canActivate: [authGuard, roleGuard]
  },
  {
    path: ':uuid',
    component: UserProfileComponent,
    canActivate: [authGuard, roleGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrivateRoutingModule { }