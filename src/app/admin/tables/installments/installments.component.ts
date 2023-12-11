import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { API, Confirm, Icon, Iinstallment, LogType } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';

@Component({
  selector: 'app-installments',
  templateUrl: './installments.component.html',
  styleUrls: ['./installments.component.scss'],
})
export class InstallmentsComponent implements OnInit {
  editinstallment: boolean = false;
  installmentdata = {} as Iinstallment;
  installmentList: Iinstallment[] = [];
  installmentorigdata = {};
  installmentid: any;
  hasDiscount: boolean = false;
  options = {
    default: 0.0,
    prefix: '₱',
    thousands: ',',
    decimal: '.',
    inputMode: CurrencyMaskInputMode.NATURAL,
  };
  lock = {
    ATIA: false,
    ATIE: false,
    ATID: false,
    ATIAS: false,
    ATIES: false,
    ATIDS: false,
  };
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastService: GlobalToastService
  ) {}
  ngOnInit(): void {
    this.getLock();
    this.getInstallment();
  }
  getLock() {
    let actions = localStorage.getItem('actions').split(',');
    for (let i in actions) {
      for (let l in this.lock) {
        if (!this.lock[l]) {
          this.lock[l] = l == actions[i];
        }
      }
    }
  }
  async getInstallment() {
    await this.service
      .API(API.INSTALLMENT)
      .getAll()
      .toPromise()
      .then((data) => {
        this.installmentList = data;
      });
  }
  save() {
    this.installmentdata.created_by = this.service.CurrentUserFullname;
    let data = {
      name: this.installmentdata.name,
      months: this.installmentdata.months,
      interest: this.installmentdata.interest,
    };
    this.service
      .API(API.INSTALLMENT)
      .CheckIfExistThenCancel(
        data,
        this.installmentList.map((data) => {
          return {
            name: data.name,
            months: data.months,
            interest: data.interest,
          };
        })
      )
      .create(this.installmentdata)
      .toPromise()
      .then((res) => {
        this.service.saveLogs(
          LogType.CREATE,
          API.INSTALLMENT,
          this.installmentdata.name
        );

        this.toastService.showSuccess(res.msg, 3000);
        this.getInstallment();
      });
  }

  edit(installment) {
    Object.assign(this.installmentorigdata, installment);
    this.editinstallment = true;
    this.installmentdata = installment;
  }
  async update() {
    this.installmentdata['updated_at'] = this.service.CurrentDate;
    this.installmentdata['updated_by'] = localStorage.getItem('email');
    let touchedData = this.service.getTouchedItem(
      this.installmentdata,
      this.installmentorigdata
    );
    await this.service
      .API(API.INSTALLMENT)
      .update(this.installmentdata.id, touchedData)
      .toPromise()
      .then((res) => {
        for (let d in touchedData) {
          let field = d;
          if (d == 'dsvalue') {
            field = 'Discount';
          }
          if (d == 'tovalue') {
            field = 'To';
          }
          if (d == 'fromvalue') {
            field = 'From';
          }
          if (d == 'hasDiscount') {
            field = 'Has discount';
          }
          if (d != 'updated_by' && d != 'updated_at') {
            this.service.saveLogs(
              LogType.UPDATE,
              API.INSTALLMENT,
              `${this.installmentdata.name}`,
              this.installmentorigdata[d],
              this.installmentdata[d],
              field
            );
          }
        }
        this.getInstallment();
        this.toastService.showSuccess(res.msg, 3000);
      });

    this.getInstallment();
    this.reset();
    this.editinstallment = false;
  }
  reset() {
    this.editinstallment = false;
    this.installmentdata = {
      name: '',
      months: 0,
      interest: 0,
      fromvalue: 0,
      tovalue: 0,
      dsvalue: 0,
      hasDiscount: false,
    };
  }
  delete(installment) {
    const modal = this.modalService.open(ConfirmationComponent);
    modal.componentInstance.ConfirmationType = Confirm.DELETE;
    modal.componentInstance.TargetItem = installment.name;
    modal.componentInstance.IconType = Icon.DELETE;
    modal.result.then((res) => {
      if (res) {
        this.service
          .API(API.INSTALLMENT)
          .delete(installment.id)
          .toPromise()
          .then((res) => {
            this.service.saveLogs(
              LogType.DELETE,
              API.INSTALLMENT,
              installment.name
            );
            this.getInstallment();
            this.toastService.showSuccess(res.msg, 3000);
          });
      }
    });
  }
}
