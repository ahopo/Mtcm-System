import { MemoriallotInfoComponent } from './modal/memoriallot-info/memoriallot-info.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoneCryptComponent } from './bone-crypt/bone-crypt.component';
import { ApartmentComponent } from './apartment/apartment.component';
import { LawnComponent } from './lawn/lawn.component';
import { RouterModule, Routes } from '@angular/router';
import { MemorialParkComponent } from './memorial-park.component';
import { MemorialLotComponent } from './memorial-lot/memorial-lot.component';
import { BootstrapIconsModule } from 'ng-bootstrap-icons';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxCurrencyModule } from 'ngx-currency';
import { NgxLoadingModule } from 'ngx-loading';
import { BoneCryptInfoComponent } from './modal/bone-crypt-info/bone-crypt-info.component';

const routes: Routes = [
  {
    path: 'memorialpark',
    component: MemorialParkComponent,
    children: [
      {
        path: 'memoriallot',
        component: MemorialLotComponent,
      },
      {
        path: 'bonecrypt',
        component: BoneCryptComponent,
      },
      {
        path: 'apartment',
        component: ApartmentComponent,
      },
      {
        path: 'lawn',
        component: LawnComponent,
      },
    ],
  },
];

@NgModule({
  declarations: [
    MemorialLotComponent,
    BoneCryptComponent,
    ApartmentComponent,
    LawnComponent,
    MemoriallotInfoComponent,
    BoneCryptInfoComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes),
    NgbModule,
    NgxPaginationModule,
    BootstrapIconsModule,
    FormsModule,
    NgxCurrencyModule,
    NgxLoadingModule.forRoot({}),
  ],
  exports: [BootstrapIconsModule, NgxCurrencyModule],
})
export class MemorialParkModule {}
