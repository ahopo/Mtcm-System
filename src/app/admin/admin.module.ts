import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from '../admin/admin.component';
import { RouterModule, Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { GroupsComponent } from './groups/groups.component';
import { UserformComponent } from './users/modal/userform/userform.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BootstrapIconsModule } from 'ng-bootstrap-icons';
import { TablesComponent } from './tables/tables.component';
import { PhaseComponent } from './Tables/phase/phase.component';
import { DocumentTemplatesComponent } from './document-templates/document-templates.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateComponent } from './groups/create/create.component';
import { LogsComponent } from './logs/logs.component';
import { InstallmentsComponent } from './tables/installments/installments.component';
import { DocumentInfoComponent } from './document-templates/modal/document-info/document-info.component';
import { NgxLoadingModule } from 'ngx-loading';
import { ORNumberComponent } from './tables/or/ornumber.component';
import { OrNumberInfoComponent } from './tables/or/modal/ornumber-info/ornumber-info.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { GeneralComponent } from './logs/general/general.component';
import { PaymentComponent } from './logs/payment/payment.component';
import { Ng9PasswordStrengthBarModule } from 'ng9-password-strength-bar';
const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      {
        path: 'user',
        component: UsersComponent,
      },
      {
        path: 'group',
        component: GroupsComponent,
        children: [
          {
            path: '',
            redirectTo: 'create',
            pathMatch: 'full',
          },
          {
            path: 'create',
            component: CreateComponent,
          },
        ],
      },
      {
        path: 'tables',
        component: TablesComponent,
        children: [
          {
            path: '',
            redirectTo: 'phase',
            pathMatch: 'full',
          },
          {
            path: 'phase',
            component: PhaseComponent,
          },
          {
            path: 'installment',
            component: InstallmentsComponent,
          },
          {
            path: 'or',
            component: ORNumberComponent,
          },
        ],
      },
      {
        path: 'template',
        component: DocumentTemplatesComponent,
      },
      {
        path: 'reports',
        component: ReportsComponent,
      },
      {
        path: 'logs',
        component: LogsComponent,
        children: [
          {
            path: '',
            redirectTo: 'general',
            pathMatch: 'full',
          },
          { path: 'general', component: GeneralComponent },
          { path: 'payment', component: PaymentComponent },
        ],
      },
    ],
  },
];

@NgModule({
  declarations: [
    AdminComponent,
    UsersComponent,
    GroupsComponent,
    UserformComponent,
    TablesComponent,
    PhaseComponent,
    DocumentTemplatesComponent,
    ReportsComponent,
    CreateComponent,
    LogsComponent,
    InstallmentsComponent,
    DocumentInfoComponent,
    ORNumberComponent,
    OrNumberInfoComponent,
    GeneralComponent,
    PaymentComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forRoot(routes),
    NgxPaginationModule,
    NgbModule,
    BootstrapIconsModule,
    NgxLoadingModule.forRoot({}),
    NgxCurrencyModule,
    Ng9PasswordStrengthBarModule,
  ],
  exports: [BootstrapIconsModule],
  bootstrap: [GroupsComponent],
})
export class AdminModule {}
