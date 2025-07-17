import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

// const routes: Routes = [
//   { path: 'login', component: LoginComponent },
//   { path: 'register', component: RegisterComponent },
//   { path: '', redirectTo: 'login', pathMatch: 'full' },
// ];
// export const routes: Routes = [
//     { path: '', component: AppComponent },
//     { path: 'auth/register', component: RegisterComponent },
//     { path: '**', redirectTo: '' },
//   ];

const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full', data: { debug: 'Redirect to login' } },
    { path: 'login', component: LoginComponent, data: { debug: 'Login loaded' } },
    { path: 'register', component: RegisterComponent, data: { debug: 'Register loaded' } },
  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}