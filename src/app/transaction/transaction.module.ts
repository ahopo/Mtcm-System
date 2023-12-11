import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionComponent } from '../transaction/transaction.component';
import { HttpClientModule } from '@angular/common/http';
import { NgxPaginationModule } from 'ngx-pagination';
import { ClientFormComponent } from './modal/client-form/client-form.component';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxCurrencyModule } from 'ngx-currency';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { BootstrapIconsModule } from 'ng-bootstrap-icons';
import { WebcamModule } from 'ngx-webcam';
import { NgxLoadingModule } from 'ngx-loading';
import { BasicInformationComponent } from './update-transaction/basic-information/basic-information.component';
import { PaymentInformationComponent } from './update-transaction/payment-information/payment-information.component';
import { UpdateTransactionComponent } from './update-transaction/update-transaction.component';
import { PaymentFormComponent } from './modal/payment-form/payment-form.component';
import { ConstractionPaymentComponent } from './update-transaction/constraction-payment/constraction-payment.component';
import { MiscellaneousPaymentComponent } from './update-transaction/miscellaneous-payment/miscellaneous-payment.component';
import { DeceasedInformationComponent } from './update-transaction/deceased-information/deceased-information.component';
import { DeceasedFormComponent } from './modal/deceased-form/deceased-form.component';
const routes: Routes = [
  {
    path: 'transaction',
    component: TransactionComponent, // this is the component with the <router-outlet> in the template
    children: [
      {
        path: 'update', // child route path
        component: UpdateTransactionComponent,
        children: [
          {
            path: '',
            redirectTo: 'basic',
            pathMatch: 'full',
          },
          { path: 'basic', component: BasicInformationComponent },
          { path: 'payment', component: PaymentInformationComponent },
          { path: 'construction', component: ConstractionPaymentComponent },
          { path: 'deceased', component: DeceasedInformationComponent },
          { path: 'miscellaneous', component: MiscellaneousPaymentComponent },
        ],
      },
      {
        path: 'main', // child route path
        component: MainComponent, // child route component that the router renders
      },
    ],
  },
];
@NgModule({
  declarations: [
    TransactionComponent,
    ClientFormComponent,
    MainComponent,
    BasicInformationComponent,
    PaymentInformationComponent,
    UpdateTransactionComponent,
    PaymentFormComponent,
    ConstractionPaymentComponent,
    MiscellaneousPaymentComponent,
    DeceasedInformationComponent,
    DeceasedFormComponent,
  ],
  imports: [
    RouterModule.forRoot(routes),
    CommonModule,
    HttpClientModule,
    NgxPaginationModule,
    FormsModule,
    NgbModule,
    NgxCurrencyModule,
    WebcamModule,
    BootstrapIconsModule,
    NgxLoadingModule.forRoot({}),
    ProgressbarModule,
  ],
  exports: [BootstrapIconsModule],
})
export class TransactionModule {}
