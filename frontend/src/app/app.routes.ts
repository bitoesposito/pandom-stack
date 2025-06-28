import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        canActivate: [authGuard],
        path: '',
        loadChildren: () => import('./private/private.module').then(m => m.PrivateModule)
    },
    {
        path: 'login',
        loadComponent: () => import('./public/components/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./public/components/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'verify',
        loadComponent: () => import('./public/components/verify/verify.component').then(m => m.VerifyComponent)
    },
    {
        path: 'recover',
        loadComponent: () => import('./public/components/recover/recover.component').then(m => m.RecoverComponent)
    },
    {
        path: 'reset',
        loadComponent: () => import('./public/components/reset/reset.component').then(m => m.ResetComponent)
    },
    {
        path: '**',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];
