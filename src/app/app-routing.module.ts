import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { MemorialParkComponent } from './memorial-park/memorial-park.component';

const routes: Routes = [
  {
    path: 'memorialpark',
    component: MemorialParkComponent,
  },
  { path: '', redirectTo: '/transaction/main', pathMatch: 'full' },
  { path: 'transaction', redirectTo: '/transaction/main', pathMatch: 'full' },
  { path: 'admin', component: AdminComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
