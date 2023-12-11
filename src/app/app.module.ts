import { MemorialParkModule } from './memorial-park/memorial-park.module';
import { AdminModule } from './admin/admin.module';
import { TransactionModule } from './transaction/transaction.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationComponent } from './modal/confirmation/confirmation.component';
import { BootstrapIconsModule } from 'ng-bootstrap-icons';
import {
  GeoAlt,
  House,
  Gear,
  PencilSquare,
  Trash,
  Collection,
  Table,
  People,
  FileEarmarkArrowDown,
  BarChart,
  Camera,
  Upload,
  BoxArrowRight,
  PersonCircle,
  Key,
  PersonPlus,
  Search,
  ArrowClockwise,
  Eye,
  CardList,
  NodePlus,
  PersonBoundingBox,
  FileEarmarkText,
  Download,
  BoxArrowLeft,
  Cash,
  CardImage,
  Geo,
  InfoCircle,
  Archive,
  Person,
  Receipt,
  FileCode,
  FileEarmarkMinus,
  ArrowRepeat,
  PatchCheck,
  ArrowDownCircle,
  Plus,
  BoundingBoxCircles,
  ExclamationCircle,
  EyeSlash,
  Briefcase,
  Exclamation,
  FileSpreadsheet,
} from 'ng-bootstrap-icons/icons';
import { CameraComponent } from './camera/camera.component';
import { WebcamModule } from 'ngx-webcam';
import { ToastsContainerComponent } from './Toast/toasts-container/toasts-container.component';
import { InputCconfirmationComponent } from './modal/input-cconfirmation/input-cconfirmation.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxLoadingModule } from 'ngx-loading';
import { MemorialParkComponent } from './memorial-park/memorial-park.component';
import { LookUpReferenceComponent } from './modal/look-up-reference/look-up-reference.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { AngularFileUploaderModule } from 'angular-file-uploader';
import { WarningComponent } from './modal/warning/warning.component';
const icons = {
  House,
  GeoAlt,
  Gear,
  Collection,
  Table,
  People,
  PencilSquare,
  Trash,
  FileEarmarkArrowDown,
  BarChart,
  Camera,
  Upload,
  BoxArrowRight,
  PersonCircle,
  Key,
  PersonPlus,
  Search,
  ArrowClockwise,
  Eye,
  CardList,
  NodePlus,
  PersonBoundingBox,
  FileEarmarkText,
  Download,
  BoxArrowLeft,
  Cash,
  CardImage,
  Geo,
  InfoCircle,
  Archive,
  Person,
  Receipt,
  FileCode,
  FileEarmarkMinus,
  ArrowRepeat,
  PatchCheck,
  ArrowDownCircle,
  Plus,
  BoundingBoxCircles,
  ExclamationCircle,
  EyeSlash,
  Briefcase,
  Exclamation,
  FileSpreadsheet,
};

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ConfirmationComponent,
    CameraComponent,
    ToastsContainerComponent,
    InputCconfirmationComponent,
    MemorialParkComponent,
    LookUpReferenceComponent,
    WarningComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    NgbModule,
    TransactionModule,
    AdminModule,
    MemorialParkModule,
    BootstrapIconsModule.pick(icons),
    WebcamModule,
    RouterModule,
    NgxPaginationModule,
    NgxLoadingModule.forRoot({}),
    AngularFileUploaderModule,
  ],
  exports: [BootstrapIconsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
