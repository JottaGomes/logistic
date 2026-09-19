import { Routes } from '@angular/router';
import { CalculateProfitComponent } from './pages/calculate-profit/calculate-profit.component';
import { RecordDataComponent } from './pages/record-data/record-data.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'calculate-profit', component: CalculateProfitComponent, canActivate: [authGuard] },
  { path: 'record-data', component: RecordDataComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'calculate-profit', pathMatch: 'full' },
];
