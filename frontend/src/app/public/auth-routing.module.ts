import { Routes } from "@angular/router";
import { LoginComponent } from "./components/login/login.component";
import { RegisterComponent } from "./components/register/register.component";
import { VerifyComponent } from "./components/verify/verify.component";
import { RecoverComponent } from "./components/recover/recover.component";
import { ResetComponent } from "./components/reset/reset.component";

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    {
        path: 'verify',
        component: VerifyComponent
    },
    {
        path: 'recover',
        component: RecoverComponent
    },
    {
        path: 'reset',
        component: ResetComponent
    }
]