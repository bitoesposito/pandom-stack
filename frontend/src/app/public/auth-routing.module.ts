import { Routes } from "@angular/router";
import { LoginComponent } from "./components/login/login.component";
import { VerifyComponent } from "./components/verify/verify.component";
import { RecoverComponent } from "./components/recover/recover.component";

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'verify',
        component: VerifyComponent
    },
    {
        path: 'recover',
        component: RecoverComponent
    }
]